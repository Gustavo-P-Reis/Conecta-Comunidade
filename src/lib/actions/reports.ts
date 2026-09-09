"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { reportSchema } from "@/lib/validations";
import type { ReportSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/events";

export async function submitReport(
  eventId: string,
  values: ReportSchema
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para denunciar um evento." };
  }

  const parsed = reportSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  const { error } = await supabase.from("reports").insert({
    event_id: eventId,
    user_id: user.id,
    reason: parsed.data.reason,
    description: parsed.data.description || null,
  });

  if (error) {
    return {
      success: false,
      message: "Não foi possível enviar a denúncia. Tente novamente.",
    };
  }

  revalidatePath("/admin/denuncias");

  return { success: true };
}

/** Marca uma denúncia como resolvida, sem remover o evento (ex: denúncia
 * avaliada e considerada improcedente). Só funciona para administradores —
 * a verificação real acontece dentro da function do Postgres. */
export async function resolveReport(reportId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_resolve_report", {
    p_report_id: reportId,
  });

  if (error) {
    return {
      success: false,
      message: "Não foi possível atualizar a denúncia.",
    };
  }

  revalidatePath("/admin/denuncias");
  revalidatePath("/admin");

  return { success: true };
}

/** Remove (oculta) o evento denunciado e marca a denúncia como resolvida.
 * Só funciona para administradores — a verificação real acontece dentro
 * da function do Postgres (admin_remove_event). */
export async function removeReportedEvent(
  eventId: string,
  reportId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const { error: removeError } = await supabase.rpc("admin_remove_event", {
    p_event_id: eventId,
  });

  if (removeError) {
    return {
      success: false,
      message: "Não foi possível remover o evento.",
    };
  }

  await supabase.rpc("admin_resolve_report", { p_report_id: reportId });

  revalidatePath("/admin/denuncias");
  revalidatePath("/admin");
  revalidatePath("/explorar");
  revalidatePath("/");

  return { success: true };
}

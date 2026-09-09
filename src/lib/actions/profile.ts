"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { profileSchema, type ProfileSchema } from "@/lib/validations";
import type { ActionResult } from "@/lib/actions/events";

export async function updateProfile(
  values: ProfileSchema
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para editar o perfil." };
  }

  const parsed = profileSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  // Observação: a coluna "role" foi deliberadamente excluída dos privilégios
  // de UPDATE do papel "authenticated" no banco (ver supabase/policies.sql).
  // Mesmo que alguém tentasse enviar { role: "admin" } aqui, o banco recusaria.
  const { error } = await supabase
    .from("profiles")
    .update({
      name: parsed.data.name,
      avatar_url: parsed.data.avatar_url || null,
    })
    .eq("id", user.id);

  if (error) {
    return {
      success: false,
      message: "Não foi possível salvar o perfil. Tente novamente.",
    };
  }

  revalidatePath("/perfil");

  return { success: true };
}

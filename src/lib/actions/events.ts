"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { eventSchema } from "@/lib/validations";
import { normalizeRegion } from "@/lib/geography";
import {
  resolveVideoChange,
  videoColumnsForInsert,
  videoColumnsForUpdate,
} from "@/lib/youtube";
import type { EventFormValues } from "@/lib/types";

export interface ActionResult {
  success: boolean;
  message?: string;
  eventId?: string;
}

export async function createEvent(
  values: EventFormValues
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para publicar um evento." };
  }

  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  // Vídeo (opcional): o servidor extrai o ID de novo e nunca confia no navegador.
  const videoChange = resolveVideoChange(parsed.data.video_url);
  if (videoChange.action === "invalid") {
    return {
      success: false,
      message: "Cole um link válido do YouTube (ex.: https://youtu.be/...).",
    };
  }

  const { data, error } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      event_date: parsed.data.event_date,
      event_time: parsed.data.event_time,
      city: parsed.data.city,
      region: normalizeRegion(parsed.data.city, parsed.data.region),
      location: parsed.data.location,
      neighborhood: parsed.data.neighborhood,
      address: parsed.data.address || null,
      is_free: parsed.data.is_free,
      price: parsed.data.is_free ? null : parsed.data.price,
      capacity: parsed.data.capacity ?? null,
      organizer_name: parsed.data.organizer_name,
      contact: parsed.data.contact || null,
      image_url: parsed.data.image_url || null,
      ...videoColumnsForInsert(videoChange),
    })
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: "Não foi possível publicar o evento. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/explorar");
  revalidatePath("/meus-eventos");

  return { success: true, eventId: data.id };
}

export async function updateEvent(
  eventId: string,
  values: EventFormValues
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para editar este evento." };
  }

  const parsed = eventSchema.safeParse(values);
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Dados inválidos.",
    };
  }

  // Vídeo: campo ausente (undefined) = não mexe no vídeo salvo; "" = remove; link válido = atualiza.
  const videoChange = resolveVideoChange(parsed.data.video_url);
  if (videoChange.action === "invalid") {
    return {
      success: false,
      message: "Cole um link válido do YouTube (ex.: https://youtu.be/...).",
    };
  }

  // A cláusula .eq("user_id", user.id) é redundante com a política de RLS,
  // mas evita uma viagem a mais ao banco só para descobrir "não autorizado".
  const { data, error } = await supabase
    .from("events")
    .update({
      title: parsed.data.title,
      description: parsed.data.description,
      category: parsed.data.category,
      event_date: parsed.data.event_date,
      event_time: parsed.data.event_time,
      city: parsed.data.city,
      region: normalizeRegion(parsed.data.city, parsed.data.region),
      location: parsed.data.location,
      neighborhood: parsed.data.neighborhood,
      address: parsed.data.address || null,
      is_free: parsed.data.is_free,
      price: parsed.data.is_free ? null : parsed.data.price,
      capacity: parsed.data.capacity ?? null,
      organizer_name: parsed.data.organizer_name,
      contact: parsed.data.contact || null,
      image_url: parsed.data.image_url || null,
      ...videoColumnsForUpdate(videoChange),
    })
    .eq("id", eventId)
    .eq("user_id", user.id)
    .select("id")
    .single();

  if (error || !data) {
    return {
      success: false,
      message: "Não foi possível salvar as alterações. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/explorar");
  revalidatePath("/meus-eventos");
  revalidatePath(`/eventos/${eventId}`);

  return { success: true, eventId };
}

export async function deleteEvent(eventId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para excluir este evento." };
  }

  const { error } = await supabase
    .from("events")
    .delete()
    .eq("id", eventId)
    .eq("user_id", user.id);

  if (error) {
    return {
      success: false,
      message: "Não foi possível excluir o evento. Tente novamente.",
    };
  }

  revalidatePath("/");
  revalidatePath("/explorar");
  revalidatePath("/meus-eventos");

  return { success: true };
}

/** Alterna o interesse do usuário atual em um evento. Retorna o novo estado
 * e a contagem atualizada, para a UI otimista poder se corrigir se preciso. */
export async function toggleInterest(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, requiresAuth: true as const };
  }

  const { data: existing } = await supabase
    .from("interests")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("interests").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("interests")
      .insert({ event_id: eventId, user_id: user.id });
  }

  const { data: event } = await supabase
    .from("events")
    .select("interest_count")
    .eq("id", eventId)
    .single();

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/explorar");
  revalidatePath("/meus-interesses");

  return {
    success: true as const,
    hasInterest: !existing,
    interestCount: event?.interest_count ?? 0,
  };
}

export async function toggleFavorite(eventId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false as const, requiresAuth: true as const };
  }

  const { data: existing } = await supabase
    .from("favorites")
    .select("id")
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    await supabase.from("favorites").delete().eq("id", existing.id);
  } else {
    await supabase
      .from("favorites")
      .insert({ event_id: eventId, user_id: user.id });
  }

  revalidatePath(`/eventos/${eventId}`);
  revalidatePath("/explorar");
  revalidatePath("/meus-interesses");

  return { success: true as const, hasFavorite: !existing };
}

export async function requireUserOrRedirect(nextPath: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect(`/login?proximo=${encodeURIComponent(nextPath)}`);
  }

  return user;
}

"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { isUuid } from "@/lib/profile-lists";

export interface SavedActionResult {
  success: boolean;
  message?: string;
  /** quantos registros foram apagados (0 = já não existia: a ação é idempotente) */
  removed?: number;
}

/**
 * Remove (só apaga, nunca insere) o interesse/favorito DO USUÁRIO LOGADO em um evento.
 * Diferente de toggleInterest/toggleFavorite, é idempotente: repetir a chamada, ou chamar
 * depois de o registro já ter sido removido em outra aba, nunca recria o registro.
 * O filtro user_id vem do servidor (getUser); a RLS é uma segunda barreira.
 */
async function removeSaved(table: "interests" | "favorites", eventId: string): Promise<SavedActionResult> {
  if (!isUuid(eventId)) {
    return { success: false, message: "Evento inválido." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, message: "Você precisa entrar para gerenciar seus eventos salvos." };
  }

  const { data, error } = await supabase
    .from(table)
    .delete()
    .eq("event_id", eventId)
    .eq("user_id", user.id)
    .select("id");

  if (error) {
    return { success: false, message: "Não foi possível remover. Tente novamente." };
  }

  revalidatePath("/perfil");
  return { success: true, removed: data?.length ?? 0 };
}

export async function removeInterest(eventId: string): Promise<SavedActionResult> {
  return removeSaved("interests", eventId);
}

export async function removeFavorite(eventId: string): Promise<SavedActionResult> {
  return removeSaved("favorites", eventId);
}

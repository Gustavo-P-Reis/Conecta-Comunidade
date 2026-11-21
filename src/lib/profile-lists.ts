/**
 * Perfil: abas (Meus eventos / Tenho interesse / Favoritos), paginação e itens salvos.
 *
 * Módulo "puro" (sem React nem Supabase), usado pela página /perfil, pelas Server Actions
 * de remoção e pelos testes. Reaproveita as tabelas existentes (events, interests, favorites):
 * nenhuma estrutura nova no banco.
 */
import type { EventRow } from "@/lib/types";

export const PROFILE_TABS = ["eventos", "interesses", "favoritos"] as const;
export type ProfileTab = (typeof PROFILE_TABS)[number];
export const DEFAULT_PROFILE_TAB: ProfileTab = "eventos";

export const PROFILE_TAB_LABELS: Record<ProfileTab, string> = {
  eventos: "Meus eventos",
  interesses: "Tenho interesse",
  favoritos: "Favoritos",
};

export const PROFILE_PAGE_SIZE = 12;
export const MAX_PROFILE_PAGE = 100000;
/** id da seção com as abas: os links dos cartões e das abas levam direto para ela. */
export const PROFILE_LIST_ANCHOR = "perfil-lista";

function firstValue(value: unknown): unknown {
  return Array.isArray(value) ? value[0] : value;
}

/** ?aba=... -> aba válida; qualquer outra coisa cai em "eventos". */
export function parseProfileTab(value: unknown): ProfileTab {
  const v = firstValue(value);
  return typeof v === "string" && (PROFILE_TABS as readonly string[]).includes(v)
    ? (v as ProfileTab)
    : DEFAULT_PROFILE_TAB;
}

/** ?pagina=... -> inteiro positivo (1 a MAX_PROFILE_PAGE); inválido = 1. */
export function parsePage(value: unknown): number {
  const v = firstValue(value);
  if (typeof v !== "string" || !/^[1-9][0-9]{0,5}$/.test(v)) return 1;
  const n = Number(v);
  return n <= MAX_PROFILE_PAGE ? n : 1;
}

export function totalPages(count: number, size: number = PROFILE_PAGE_SIZE): number {
  if (!Number.isFinite(count) || count <= 0) return 1;
  return Math.max(1, Math.ceil(count / size));
}

/** Mantém a página dentro de [1, totalPages]. */
export function clampPage(page: number, count: number, size: number = PROFILE_PAGE_SIZE): number {
  return Math.min(Math.max(1, page), totalPages(count, size));
}

/** Intervalo (inclusivo) para .range() do Supabase. */
export function pageRange(page: number, size: number = PROFILE_PAGE_SIZE): { from: number; to: number } {
  const from = (page - 1) * size;
  return { from, to: from + size - 1 };
}

/** URL do perfil: aba padrão e página 1 ficam implícitas. */
export function buildProfileHref(tab: ProfileTab, page: number = 1): string {
  const params: string[] = [];
  if (tab !== DEFAULT_PROFILE_TAB) params.push(`aba=${tab}`);
  if (page > 1) params.push(`pagina=${page}`);
  return params.length > 0 ? `/perfil?${params.join("&")}` : "/perfil";
}

/** Igual a buildProfileHref, mas rola até a lista ao navegar. */
export function profileListHref(tab: ProfileTab, page: number = 1): string {
  return `${buildProfileHref(tab, page)}#${PROFILE_LIST_ANCHOR}`;
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  );
}

/* -------------------------------------------------------------------------- */
/* Itens salvos (interesses e favoritos)                                       */
/* -------------------------------------------------------------------------- */

export type SavedItem =
  | { kind: "available"; eventId: string; event: EventRow }
  | { kind: "unavailable"; eventId: string };

export interface SavedRow {
  event_id: string;
  created_at?: string;
  event?: EventRow | EventRow[] | null;
}

/**
 * Converte as linhas de interests/favorites (com o evento embutido) em itens da lista.
 * "Disponível" = o evento veio na consulta (a RLS esconde eventos de outras pessoas que
 * foram removidos) E está publicado. Todo o resto vira "indisponível": o item continua na
 * lista (assim o número exibido bate com os cartões) e a pessoa pode removê-lo.
 */
export function toSavedItems(rows: readonly SavedRow[] | null | undefined): SavedItem[] {
  const items: SavedItem[] = [];
  for (const row of rows ?? []) {
    if (!row || typeof row.event_id !== "string") continue;
    const raw = Array.isArray(row.event) ? row.event[0] : row.event;
    const available =
      !!raw && typeof raw === "object" && raw.id === row.event_id && raw.status === "published";
    items.push(
      available
        ? { kind: "available", eventId: row.event_id, event: raw as EventRow }
        : { kind: "unavailable", eventId: row.event_id }
    );
  }
  return items;
}

/** Aviso sobre eventos do próprio usuário removidos pela moderação (fora da lista publicada). */
export function removedEventsNotice(count: number): string | null {
  if (!Number.isFinite(count) || count <= 0) return null;
  return count === 1
    ? "1 evento seu foi removido pela moderação e não aparece nesta lista."
    : `${count} eventos seus foram removidos pela moderação e não aparecem nesta lista.`;
}

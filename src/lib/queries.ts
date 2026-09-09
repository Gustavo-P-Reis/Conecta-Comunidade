import type { SupabaseClient } from "@supabase/supabase-js";
import { CATEGORIES } from "@/lib/constants";
import type { EventRow, EventWithViewerState, PlatformStats } from "@/lib/types";

/** Anexa a cada evento se o usuário atual já demonstrou interesse / favoritou.
 * Faz no máximo 2 consultas extras, independentemente da quantidade de eventos. */
export async function attachViewerState(
  supabase: SupabaseClient,
  events: EventRow[],
  userId: string | null
): Promise<EventWithViewerState[]> {
  if (!userId || events.length === 0) {
    return events.map((e) => ({ ...e, viewer_has_interest: false, viewer_has_favorite: false }));
  }

  const eventIds = events.map((e) => e.id);

  const [{ data: interests }, { data: favorites }] = await Promise.all([
    supabase.from("interests").select("event_id").eq("user_id", userId).in("event_id", eventIds),
    supabase.from("favorites").select("event_id").eq("user_id", userId).in("event_id", eventIds),
  ]);

  const interestSet = new Set((interests ?? []).map((i: { event_id: string }) => i.event_id));
  const favoriteSet = new Set((favorites ?? []).map((f: { event_id: string }) => f.event_id));

  return events.map((event) => ({
    ...event,
    viewer_has_interest: interestSet.has(event.id),
    viewer_has_favorite: favoriteSet.has(event.id),
  }));
}

export async function getPlatformStats(supabase: SupabaseClient): Promise<PlatformStats> {
  const [{ count: totalEvents }, { data: eventsForStats }] = await Promise.all([
    supabase.from("events").select("id", { count: "exact", head: true }).eq("status", "published"),
    supabase.from("events").select("interest_count, neighborhood").eq("status", "published"),
  ]);

  const totalInterested = (eventsForStats ?? []).reduce(
    (sum: number, e: { interest_count: number }) => sum + e.interest_count,
    0
  );
  const totalCommunities = new Set(
    (eventsForStats ?? []).map((e: { neighborhood: string }) => e.neighborhood)
  ).size;

  return {
    totalEvents: totalEvents ?? 0,
    totalInterested,
    totalCategories: CATEGORIES.length,
    totalCommunities,
  };
}

export async function getCategoryCounts(
  supabase: SupabaseClient
): Promise<Record<string, number>> {
  const { data } = await supabase
    .from("events")
    .select("category")
    .eq("status", "published");

  const counts: Record<string, number> = {};
  for (const row of data ?? []) {
    const category = (row as { category: string }).category;
    counts[category] = (counts[category] ?? 0) + 1;
  }
  return counts;
}

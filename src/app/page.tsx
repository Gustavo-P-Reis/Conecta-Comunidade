import { createClient } from "@/lib/supabase/server";
import { attachViewerState, getPlatformStats, getCategoryCounts } from "@/lib/queries";
import { Hero } from "@/components/home/hero";
import { StatsSection } from "@/components/home/stats-section";
import { CategoriesSection } from "@/components/home/categories-section";
import { FeaturedEvents } from "@/components/home/featured-events";
import type { EventRow } from "@/lib/types";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ data: previewEvents }, { data: featuredEvents }, stats, categoryCounts] =
    await Promise.all([
      supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .not("image_url", "is", null)
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("event_date", { ascending: true })
        .limit(2),
      supabase
        .from("events")
        .select("*")
        .eq("status", "published")
        .gte("event_date", new Date().toISOString().slice(0, 10))
        .order("interest_count", { ascending: false })
        .order("event_date", { ascending: true })
        .limit(5),
      getPlatformStats(supabase),
      getCategoryCounts(supabase),
    ]);

  const featuredWithState = await attachViewerState(
    supabase,
    (featuredEvents ?? []) as EventRow[],
    user?.id ?? null
  );

  return (
    <>
      <Hero previewEvents={(previewEvents ?? []) as EventRow[]} />
      <StatsSection stats={stats} />
      <CategoriesSection counts={categoryCounts} />
      <FeaturedEvents events={featuredWithState} />
    </>
  );
}

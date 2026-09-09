import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { attachViewerState } from "@/lib/queries";
import { EventFilters } from "@/components/events/event-filters";
import { EventGrid } from "@/components/events/event-grid";
import { EVENTS_PER_PAGE } from "@/lib/constants";
import { cn } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Explorar eventos" };

interface SearchParams {
  q?: string;
  category?: string;
  date?: string;
  price?: string;
  sort?: string;
  page?: string;
}

export default async function ExplorarPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const page = Math.max(1, Number(params.page) || 1);
  const from = (page - 1) * EVENTS_PER_PAGE;
  const to = from + EVENTS_PER_PAGE - 1;

  let query = supabase
    .from("events")
    .select("*", { count: "exact" })
    .eq("status", "published");

  if (params.q) {
    const safeQuery = params.q.replace(/[,()%]/g, " ").trim();
    if (safeQuery) {
      query = query.or(
        `title.ilike.%${safeQuery}%,description.ilike.%${safeQuery}%,neighborhood.ilike.%${safeQuery}%,location.ilike.%${safeQuery}%`
      );
    }
  }

  if (params.category) {
    query = query.eq("category", params.category);
  }

  if (params.date) {
    query = query.eq("event_date", params.date);
  }

  if (params.price === "gratuito") {
    query = query.eq("is_free", true);
  } else if (params.price === "pago") {
    query = query.eq("is_free", false);
  }

  switch (params.sort) {
    case "populares":
      query = query.order("interest_count", { ascending: false });
      break;
    case "proximos":
      query = query.order("event_date", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, count } = await query.range(from, to);
  const events = await attachViewerState(supabase, (data ?? []) as EventRow[], user?.id ?? null);

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / EVENTS_PER_PAGE));

  function pageHref(target: number) {
    const search = new URLSearchParams(
      Object.entries(params).filter(([k, v]) => !!v && k !== "page") as [string, string][]
    );
    if (target > 1) search.set("page", String(target));
    const qs = search.toString();
    return qs ? `/explorar?${qs}` : "/explorar";
  }

  return (
    <div className="container-app py-10 lg:py-14">
      <div className="mb-8 flex flex-col gap-2">
        <h1 className="font-display text-3xl font-medium text-balance sm:text-4xl">
          Explore eventos
        </h1>
        <p className="text-muted-foreground">
          Encontre algo interessante para fazer perto de você.
        </p>
      </div>

      <div className="mb-8">
        <EventFilters />
      </div>

      <p className="mb-4 text-sm text-muted-foreground">
        {count ?? 0} {count === 1 ? "evento encontrado" : "eventos encontrados"}
      </p>

      <EventGrid events={events} />

      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Link
            href={pageHref(Math.max(1, page - 1))}
            aria-disabled={page === 1}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-border-strong",
              page === 1 ? "pointer-events-none opacity-40" : "hover:bg-card"
            )}
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="px-3 text-sm text-muted-foreground">
            Página {page} de {totalPages}
          </span>
          <Link
            href={pageHref(Math.min(totalPages, page + 1))}
            aria-disabled={page === totalPages}
            className={cn(
              "flex size-9 items-center justify-center rounded-full border border-border-strong",
              page === totalPages ? "pointer-events-none opacity-40" : "hover:bg-card"
            )}
          >
            <ChevronRight className="size-4" />
          </Link>
        </div>
      )}
    </div>
  );
}

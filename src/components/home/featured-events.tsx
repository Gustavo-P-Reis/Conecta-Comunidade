import Link from "next/link";
import { ArrowRight, CalendarX } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { EventWithViewerState } from "@/lib/types";

export function FeaturedEvents({ events }: { events: EventWithViewerState[] }) {
  const [main, ...rest] = events;

  return (
    <section className="container-app py-16 lg:py-24">
      <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex flex-col gap-2">
          <h2 className="font-display text-3xl font-medium text-balance sm:text-4xl">
            Eventos que estão movimentando a comunidade
          </h2>
          <p className="max-w-lg text-muted-foreground">
            Uma seleção do que está próximo e reunindo mais gente interessada.
          </p>
        </div>
        <Link
          href="/explorar"
          className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline shrink-0"
        >
          Ver todos os eventos <ArrowRight className="size-4" />
        </Link>
      </div>

      {!main ? (
        <EmptyState
          icon={CalendarX}
          title="Ainda não há eventos publicados"
          description="Seja a primeira pessoa a divulgar um evento na sua comunidade."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-4 lg:grid-rows-2">
          <EventCard event={main} variant="large" className="lg:col-span-2 lg:row-span-2" />
          {rest.slice(0, 4).map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </section>
  );
}

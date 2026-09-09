import { CalendarX } from "lucide-react";
import { EventCard } from "@/components/events/event-card";
import { EmptyState } from "@/components/shared/empty-state";
import type { EventWithViewerState } from "@/lib/types";

export function EventGrid({
  events,
  emptyTitle = "Nenhum evento encontrado",
  emptyDescription = "Tente ajustar os filtros ou volte mais tarde.",
}: {
  events: EventWithViewerState[];
  emptyTitle?: string;
  emptyDescription?: string;
}) {
  if (events.length === 0) {
    return <EmptyState icon={CalendarX} title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

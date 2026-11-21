import Link from "next/link";
import Image from "next/image";
import { Eye, PencilLine, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DeleteEventDialog } from "@/components/events/delete-event-dialog";
import { formatEventDateLong, formatEventTime, isEventUpcoming } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

/**
 * Linha de gerenciamento de um evento do usuário (Ver, Editar, Excluir).
 * Extraída de /meus-eventos sem mudar o markup, para ser reaproveitada na aba
 * "Meus eventos" do perfil.
 */
export function MyEventRow({ event }: { event: EventRow }) {
  return (
    <div className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center">
      <div className="relative aspect-[4/3] w-full shrink-0 overflow-hidden rounded-md bg-secondary sm:w-32">
        {event.image_url && (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="128px"
            className="object-cover"
          />
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="mb-1.5 flex flex-wrap items-center gap-2">
          <h3 className="font-display text-lg font-medium truncate">{event.title}</h3>
          {event.status === "removed" && (
            <Badge variant="destructive">Removido pela moderação</Badge>
          )}
          {event.status === "published" && !isEventUpcoming(event.event_date) && (
            <Badge variant="secondary">Encerrado</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {formatEventDateLong(event.event_date)} · {formatEventTime(event.event_time)}
        </p>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Users className="size-3.5" />
          {event.interest_count} {event.interest_count === 1 ? "interessado" : "interessados"}
        </p>
      </div>

      <div className="flex shrink-0 gap-2 sm:flex-col lg:flex-row">
        <Button variant="outline" size="sm" asChild>
          <Link href={`/eventos/${event.id}`}>
            <Eye className="size-4" /> Ver
          </Link>
        </Button>
        <Button variant="outline" size="sm" asChild>
          <Link href={`/meus-eventos/${event.id}/editar`}>
            <PencilLine className="size-4" /> Editar
          </Link>
        </Button>
        <DeleteEventDialog eventId={event.id} eventTitle={event.title} />
      </div>
    </div>
  );
}

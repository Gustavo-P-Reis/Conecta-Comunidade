"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { EventCard } from "@/components/events/event-card";
import { UnavailableEventCard } from "@/components/events/unavailable-event-card";
import { Button } from "@/components/ui/button";
import { removeFavorite, removeInterest } from "@/lib/actions/saved-events";
import type { SavedItem } from "@/lib/profile-lists";

export type SavedKind = "interest" | "favorite";

const COPY = {
  interest: {
    button: "Remover interesse",
    success: "Interesse removido.",
    failure: "Não foi possível remover o interesse.",
  },
  favorite: {
    button: "Remover dos favoritos",
    success: "Removido dos favoritos.",
    failure: "Não foi possível remover o favorito.",
  },
} as const;

/**
 * Lista de interesses ou favoritos do perfil. Cada item tem um botão para remover (ação
 * dedicada e idempotente, nunca "alternar"). Ao remover com sucesso, o cartão some, aparece
 * um aviso e a página é atualizada para recalcular os números e a paginação.
 */
export function SavedEventsList({ kind, items }: { kind: SavedKind; items: SavedItem[] }) {
  const router = useRouter();
  const [removed, setRemoved] = React.useState<Set<string>>(() => new Set());
  const [pending, setPending] = React.useState<Set<string>>(() => new Set());

  async function handleRemove(eventId: string) {
    if (pending.has(eventId)) return;
    setPending((current) => new Set(current).add(eventId));

    const result =
      kind === "interest" ? await removeInterest(eventId) : await removeFavorite(eventId);

    setPending((current) => {
      const next = new Set(current);
      next.delete(eventId);
      return next;
    });

    if (result.success) {
      setRemoved((current) => new Set(current).add(eventId));
      toast.success(COPY[kind].success);
      router.refresh();
    } else {
      toast.error(result.message ?? COPY[kind].failure);
    }
  }

  const visible = items.filter((item) => !removed.has(item.eventId));

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      {visible.map((item) => {
        const isPending = pending.has(item.eventId);
        const label =
          item.kind === "available"
            ? `${COPY[kind].button}: ${item.event.title}`
            : COPY[kind].button;
        const button = (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => handleRemove(item.eventId)}
            disabled={isPending}
            aria-label={label}
          >
            {isPending ? <Loader2 className="size-4 animate-spin" /> : <X className="size-4" />}
            {COPY[kind].button}
          </Button>
        );

        return item.kind === "available" ? (
          <div key={item.eventId} className="flex flex-col gap-2">
            <EventCard event={item.event} showFavoriteButton={false} />
            {button}
          </div>
        ) : (
          <UnavailableEventCard key={item.eventId} action={button} />
        );
      })}
    </div>
  );
}

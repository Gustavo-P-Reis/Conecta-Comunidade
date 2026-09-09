import Link from "next/link";
import Image from "next/image";
import { MapPin, Users } from "lucide-react";
import { CategoryBadge } from "@/components/shared/category-badge";
import { FavoriteButton } from "@/components/events/favorite-button";
import { formatEventDateLong, formatEventTime, formatPrice, cn } from "@/lib/utils";
import type { EventWithViewerState } from "@/lib/types";

export function EventCard({
  event,
  variant = "default",
  className,
}: {
  event: EventWithViewerState;
  variant?: "default" | "large";
  className?: string;
}) {
  const isLarge = variant === "large";

  return (
    <Link
      href={`/eventos/${event.id}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-lg border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:border-border-strong hover:shadow-[var(--shadow-elevated)]",
        className
      )}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-secondary",
          isLarge ? "aspect-[16/10]" : "aspect-[4/3]"
        )}
      >
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes={isLarge ? "(min-width: 1024px) 60vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground text-sm">
            Sem imagem
          </div>
        )}

        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/50 to-transparent pointer-events-none" />

        <div className="absolute left-3 top-3">
          <CategoryBadge category={event.category} />
        </div>

        <div className="absolute right-3 top-3">
          <FavoriteButton
            eventId={event.id}
            initialFavorited={!!event.viewer_has_favorite}
          />
        </div>

        <div className="absolute left-3 bottom-3">
          <span className="rounded-full bg-background/70 backdrop-blur-sm border border-border-strong px-3 py-1 text-xs font-medium text-foreground">
            {event.is_free ? "Gratuito" : formatPrice(Number(event.price))}
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2.5 p-4">
        <h3
          className={cn(
            "font-display font-medium leading-snug text-balance line-clamp-2",
            isLarge ? "text-2xl" : "text-base"
          )}
        >
          {event.title}
        </h3>

        <div className="mt-auto flex flex-col gap-1.5 text-sm text-muted-foreground">
          <p>
            {formatEventDateLong(event.event_date)} · {formatEventTime(event.event_time)}
          </p>
          <p className="flex items-center gap-1.5 truncate">
            <MapPin className="size-3.5 shrink-0" />
            <span className="truncate">
              {event.location} · {event.neighborhood}
            </span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 pt-1 text-xs text-muted-foreground">
          <Users className="size-3.5" />
          {event.interest_count} {event.interest_count === 1 ? "interessado" : "interessados"}
        </div>
      </div>
    </Link>
  );
}

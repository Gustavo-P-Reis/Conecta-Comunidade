import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ArrowLeft, CalendarDays, Clock, MapPin, Ticket, Users, User } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { CategoryBadge } from "@/components/shared/category-badge";
import { InterestButton } from "@/components/events/interest-button";
import { FavoriteButton } from "@/components/events/favorite-button";
import { ShareButton } from "@/components/events/share-button";
import { ReportDialog } from "@/components/events/report-dialog";
import { DeleteEventDialog } from "@/components/events/delete-event-dialog";
import { YouTubeEmbed } from "@/components/events/youtube-embed";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatEventDateLong, formatEventTime, formatPrice } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

async function getEvent(id: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: event } = await supabase
    .from("events")
    .select("*")
    .eq("id", id)
    .single();

  if (!event) return { event: null, viewerId: null, hasInterest: false, hasFavorite: false };

  let hasInterest = false;
  let hasFavorite = false;

  if (user) {
    const [{ data: interest }, { data: favorite }] = await Promise.all([
      supabase
        .from("interests")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      supabase
        .from("favorites")
        .select("id")
        .eq("event_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);
    hasInterest = !!interest;
    hasFavorite = !!favorite;
  }

  return { event: event as EventRow, viewerId: user?.id ?? null, hasInterest, hasFavorite };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const { event } = await getEvent(id);
  if (!event) return { title: "Evento não encontrado" };
  return {
    title: event.title,
    description: event.description.slice(0, 160),
  };
}

export default async function EventPage({ params }: PageProps) {
  const { id } = await params;
  const { event, viewerId, hasInterest, hasFavorite } = await getEvent(id);

  if (!event) notFound();

  const isOwner = viewerId === event.user_id;

  return (
    <div className="container-app py-8 lg:py-12">
      <Link
        href="/explorar"
        className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="size-4" /> Voltar para eventos
      </Link>

      {event.status === "removed" && (
        <div className="mb-6 rounded-lg border border-destructive/30 bg-destructive-soft px-4 py-3 text-sm text-destructive">
          Este evento foi removido pela moderação e não aparece mais publicamente.
        </div>
      )}

      <div className="relative mb-8 aspect-[16/9] w-full overflow-hidden rounded-xl border border-border bg-secondary sm:aspect-[21/9]">
        {event.image_url ? (
          <Image
            src={event.image_url}
            alt={event.title}
            fill
            sizes="100vw"
            priority
            className="object-cover"
          />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            Sem imagem
          </div>
        )}
        <div className="absolute left-4 top-4">
          <CategoryBadge category={event.category} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1fr_23rem]">
        <div className="flex flex-col gap-6">
          {isOwner && (
            <div className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3">
              <p className="text-sm text-muted-foreground">Este é o seu evento.</p>
              <div className="ml-auto flex gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/meus-eventos/${event.id}/editar`}>Editar</Link>
                </Button>
                <DeleteEventDialog
                  eventId={event.id}
                  eventTitle={event.title}
                  redirectTo="/meus-eventos"
                />
              </div>
            </div>
          )}

          <h1 className="font-display text-3xl font-medium text-balance sm:text-4xl">
            {event.title}
          </h1>

          <p className="whitespace-pre-line text-base leading-relaxed text-muted-foreground">
            {event.description}
          </p>

          <YouTubeEmbed videoId={event.youtube_video_id} title={event.title} />
        </div>

        <div className="flex flex-col gap-5">
          <Card>
            <CardContent className="flex flex-col gap-4 p-5">
              <div className="flex items-start gap-3">
                <CalendarDays className="size-4.5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{formatEventDateLong(event.event_date)}</p>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Clock className="size-3.5" /> {formatEventTime(event.event_time)}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="size-4.5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{event.location}</p>
                  <p className="text-sm text-muted-foreground">
                    {event.neighborhood}
                    {event.address ? ` · ${event.address}` : ""}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Ticket className="size-4.5 mt-0.5 shrink-0 text-primary" />
                <p className="text-sm font-medium">
                  {event.is_free ? "Gratuito" : formatPrice(Number(event.price))}
                  {event.capacity && (
                    <span className="block text-sm font-normal text-muted-foreground">
                      Capacidade: {event.capacity} pessoas
                    </span>
                  )}
                </p>
              </div>

              <div className="flex items-start gap-3">
                <User className="size-4.5 mt-0.5 shrink-0 text-primary" />
                <div>
                  <p className="text-sm font-medium">{event.organizer_name}</p>
                  {event.contact && (
                    <p className="text-sm text-muted-foreground">{event.contact}</p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3 border-t border-border pt-4">
                <Users className="size-4.5 mt-0.5 shrink-0 text-primary" />
                <p className="text-sm text-muted-foreground">
                  {event.favorite_count} {event.favorite_count === 1 ? "favorito" : "favoritos"}
                </p>
              </div>
            </CardContent>
          </Card>

          <InterestButton
            eventId={event.id}
            initialInterested={hasInterest}
            initialCount={event.interest_count}
          />

          <div className="flex flex-wrap items-center gap-3">
            <FavoriteButton eventId={event.id} initialFavorited={hasFavorite} variant="full" />
            <ShareButton title={event.title} path={`/eventos/${event.id}`} />
            {!isOwner && <ReportDialog eventId={event.id} isAuthenticated={!!viewerId} />}
          </div>
        </div>
      </div>
    </div>
  );
}

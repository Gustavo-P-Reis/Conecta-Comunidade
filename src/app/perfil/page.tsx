import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, CalendarPlus, HandHeart, Heart, Info } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { ProfileEditForm } from "@/components/shared/profile-edit-form";
import { ProfilePagination } from "@/components/profile/profile-pagination";
import { ProfileTabsNav } from "@/components/profile/profile-tabs-nav";
import { SavedEventsList } from "@/components/profile/saved-events-list";
import { MyEventRow } from "@/components/events/my-event-row";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatEventDateLong } from "@/lib/utils";
import {
  PROFILE_LIST_ANCHOR,
  buildProfileHref,
  clampPage,
  pageRange,
  parsePage,
  parseProfileTab,
  profileListHref,
  removedEventsNotice,
  toSavedItems,
  totalPages,
  type ProfileTab,
  type SavedItem,
} from "@/lib/profile-lists";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Meu perfil" };

interface PageProps {
  searchParams: Promise<{ aba?: string | string[]; pagina?: string | string[] }>;
}

export default async function PerfilPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/perfil");

  const tab = parseProfileTab(params.aba);
  const requestedPage = parsePage(params.pagina);

  // Números e listas saem das MESMAS tabelas e filtros: o número de uma aba é o total de
  // itens da lista dela. "Eventos publicados" conta só status = published (removidos pela
  // moderação têm aviso próprio).
  const [{ data: profile }, publishedRes, removedRes, interestsRes, favoritesRes, { data: recentEvents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "published"),
      supabase
        .from("events")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "removed"),
      supabase.from("interests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("events")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  // Falha ao contar não pode virar "0" (pareceria um número real): mostra a tela de erro.
  if (publishedRes.error || interestsRes.error || favoritesRes.error) {
    throw new Error("Não foi possível carregar o seu perfil.");
  }
  if (!profile) redirect("/login");

  const counts: Record<ProfileTab, number> = {
    eventos: publishedRes.count ?? 0,
    interesses: interestsRes.count ?? 0,
    favoritos: favoritesRes.count ?? 0,
  };
  const removedNotice = removedEventsNotice(removedRes.count ?? 0);

  // Página fora do intervalo (ex.: removeu o último item da última página) volta para a última.
  const page = clampPage(requestedPage, counts[tab]);
  if (page !== requestedPage) redirect(buildProfileHref(tab, page));
  const { from, to } = pageRange(page);

  let myEvents: EventRow[] = [];
  let savedItems: SavedItem[] = [];

  if (tab === "eventos") {
    const { data, error } = await supabase
      .from("events")
      .select("*")
      .eq("user_id", user.id)
      .eq("status", "published")
      .order("event_date", { ascending: false })
      .order("created_at", { ascending: false })
      .range(from, to);
    if (error) throw new Error("Não foi possível carregar os seus eventos.");
    myEvents = (data ?? []) as EventRow[];
  } else {
    const { data, error } = await supabase
      .from(tab === "interesses" ? "interests" : "favorites")
      .select("event_id, created_at, event:events(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .range(from, to);
    if (error) throw new Error("Não foi possível carregar a lista.");
    savedItems = toSavedItems(data);
  }

  const stats = [
    { tab: "eventos" as const, icon: CalendarHeart, label: "Eventos publicados", value: counts.eventos },
    { tab: "interesses" as const, icon: HandHeart, label: "Interesses", value: counts.interesses },
    { tab: "favoritos" as const, icon: Heart, label: "Favoritos", value: counts.favoritos },
  ];

  return (
    <div className="container-app max-w-3xl py-10 lg:py-14">
      <PageHeader title="Meu perfil" className="mb-8" />

      <div className="mb-8 flex items-center gap-4">
        <Avatar className="size-16">
          <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name} />
          <AvatarFallback className="text-lg">{getInitials(profile.name)}</AvatarFallback>
        </Avatar>
        <div>
          <p className="font-display text-xl font-medium">{profile.name}</p>
          <p className="text-sm text-muted-foreground">
            Na comunidade desde {formatEventDateLong(profile.created_at.slice(0, 10))}
          </p>
        </div>
      </div>

      <div className="mb-10 grid grid-cols-3 gap-3">
        {stats.map((stat) => (
          <Link
            key={stat.tab}
            href={profileListHref(stat.tab)}
            className="group rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
          >
            <Card className="h-full transition-colors group-hover:border-primary/40">
              <CardContent className="flex flex-col items-center gap-2 p-4 text-center sm:items-start sm:text-left">
                <stat.icon className="size-4 text-primary" />
                <p className="font-display text-2xl font-medium">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <section
        id={PROFILE_LIST_ANCHOR}
        aria-label="Meus eventos, interesses e favoritos"
        className="mb-12 flex scroll-mt-24 flex-col gap-6"
      >
        <ProfileTabsNav active={tab} counts={counts} />

        {tab === "eventos" && (
          <>
            {removedNotice && (
              <div className="flex items-start gap-2 rounded-lg border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                <Info className="mt-0.5 size-4 shrink-0" />
                <p>
                  {removedNotice}{" "}
                  <Link href="/meus-eventos" className="font-medium text-primary hover:underline">
                    Ver em Meus eventos
                  </Link>
                </p>
              </div>
            )}

            {counts.eventos === 0 ? (
              <EmptyState
                icon={CalendarPlus}
                title="Você ainda não publicou nenhum evento"
                description="Divulgue o primeiro evento da sua comunidade agora mesmo."
                action={
                  <Button asChild>
                    <Link href="/criar-evento">Divulgar um evento</Link>
                  </Button>
                }
              />
            ) : (
              <>
                <div className="flex justify-end">
                  <Button size="sm" asChild>
                    <Link href="/criar-evento">
                      <CalendarPlus className="size-4" /> Novo evento
                    </Link>
                  </Button>
                </div>
                <div className="flex flex-col gap-3">
                  {myEvents.map((event) => (
                    <MyEventRow key={event.id} event={event} />
                  ))}
                </div>
              </>
            )}
          </>
        )}

        {tab === "interesses" &&
          (counts.interesses === 0 ? (
            <EmptyState
              icon={HandHeart}
              title="Você ainda não demonstrou interesse em nenhum evento"
              description='Clique em "Tenho interesse" na página de um evento para acompanhá-lo aqui.'
              action={
                <Button asChild>
                  <Link href="/explorar">Explorar eventos</Link>
                </Button>
              }
            />
          ) : (
            <SavedEventsList key={`interesses-${page}`} kind="interest" items={savedItems} />
          ))}

        {tab === "favoritos" &&
          (counts.favoritos === 0 ? (
            <EmptyState
              icon={Heart}
              title="Nenhum favorito ainda"
              description="Favorite eventos para encontrá-los rapidamente depois."
              action={
                <Button asChild>
                  <Link href="/explorar">Explorar eventos</Link>
                </Button>
              }
            />
          ) : (
            <SavedEventsList key={`favoritos-${page}`} kind="favorite" items={savedItems} />
          ))}

        <ProfilePagination tab={tab} page={page} totalPages={totalPages(counts[tab])} />
      </section>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Editar perfil</h2>
            <ProfileEditForm profile={profile} />
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h2 className="mb-4 font-display text-lg font-medium">Atividade recente</h2>
            {!recentEvents || recentEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nenhuma atividade ainda — que tal publicar seu primeiro evento?
              </p>
            ) : (
              <ul className="flex flex-col gap-3">
                {recentEvents.map((event) => (
                  <li key={event.id}>
                    <Link
                      href={`/eventos/${event.id}`}
                      className="flex items-center justify-between gap-3 text-sm hover:text-primary transition-colors"
                    >
                      <span className="truncate">Você publicou &ldquo;{event.title}&rdquo;</span>
                      <span className="shrink-0 text-xs text-muted-foreground">
                        {formatEventDateLong(event.created_at.slice(0, 10))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

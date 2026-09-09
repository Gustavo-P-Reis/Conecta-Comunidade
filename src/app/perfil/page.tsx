import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarHeart, HandHeart, Heart } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { ProfileEditForm } from "@/components/shared/profile-edit-form";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials, formatEventDateLong } from "@/lib/utils";

export const metadata = { title: "Meu perfil" };

export default async function PerfilPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/perfil");

  const [{ data: profile }, { count: eventsCount }, { count: interestsCount }, { count: favoritesCount }, { data: recentEvents }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", user.id).single(),
      supabase.from("events").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("interests").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase.from("favorites").select("id", { count: "exact", head: true }).eq("user_id", user.id),
      supabase
        .from("events")
        .select("id, title, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

  if (!profile) redirect("/login");

  const stats = [
    { icon: CalendarHeart, label: "Eventos publicados", value: eventsCount ?? 0 },
    { icon: HandHeart, label: "Interesses", value: interestsCount ?? 0 },
    { icon: Heart, label: "Favoritos", value: favoritesCount ?? 0 },
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
          <Card key={stat.label}>
            <CardContent className="flex flex-col items-center gap-2 p-4 text-center sm:items-start sm:text-left">
              <stat.icon className="size-4 text-primary" />
              <p className="font-display text-2xl font-medium">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

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

import Link from "next/link";
import { redirect } from "next/navigation";
import { Users, CalendarDays, HandHeart, Flag, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart } from "@/components/shared/bar-chart";
import { getCategoryMeta } from "@/lib/constants";
import { formatEventDateLong } from "@/lib/utils";

export const metadata = { title: "Administração" };

function getWeeklyBuckets(createdDates: string[], weeks = 8) {
  const now = new Date();
  const buckets: { label: string; value: number }[] = [];

  for (let i = weeks - 1; i >= 0; i--) {
    const start = new Date(now);
    start.setDate(start.getDate() - i * 7 - now.getDay());
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const count = createdDates.filter((d) => {
      const date = new Date(d);
      return date >= start && date < end;
    }).length;

    buckets.push({
      label: start.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" }),
      value: count,
    });
  }
  return buckets;
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/admin");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const [
    { count: totalUsers },
    { data: allEvents },
    { count: pendingReports },
  ] = await Promise.all([
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase
      .from("events")
      .select("id, title, category, is_free, interest_count, status, created_at")
      .order("created_at", { ascending: false }),
    supabase.from("reports").select("id", { count: "exact", head: true }).eq("status", "pending"),
  ]);

  const events = allEvents ?? [];
  const totalInterested = events.reduce((sum, e) => sum + (e.interest_count ?? 0), 0);

  const categoryData = Object.entries(
    events.reduce<Record<string, number>>((acc, e) => {
      acc[e.category] = (acc[e.category] ?? 0) + 1;
      return acc;
    }, {})
  )
    .map(([category, value]) => ({ label: getCategoryMeta(category).label, value }))
    .sort((a, b) => b.value - a.value);

  const freeCount = events.filter((e) => e.is_free).length;
  const paidCount = events.length - freeCount;

  const weeklyData = getWeeklyBuckets(events.map((e) => e.created_at));

  const popularEvents = [...events].sort((a, b) => b.interest_count - a.interest_count).slice(0, 5);
  const recentEvents = events.slice(0, 5);

  const stats = [
    { icon: Users, label: "Usuários", value: totalUsers ?? 0 },
    { icon: CalendarDays, label: "Eventos", value: events.length },
    { icon: HandHeart, label: "Marcações de interesse", value: totalInterested },
    { icon: Flag, label: "Denúncias pendentes", value: pendingReports ?? 0 },
  ];

  return (
    <div className="container-app py-10 lg:py-14">
      <PageHeader
        title="Administração"
        description="Visão geral da plataforma."
        action={
          <Link
            href="/admin/denuncias"
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
          >
            Ver denúncias <ArrowRight className="size-4" />
          </Link>
        }
        className="mb-10"
      />

      <div className="mb-10 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="flex flex-col gap-2 p-5">
              <stat.icon className="size-4 text-primary" />
              <p className="font-display text-2xl font-medium sm:text-3xl">{stat.value}</p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mb-10 grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos por categoria</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={categoryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Gratuito x pago</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart
              data={[
                { label: "Gratuitos", value: freeCount },
                { label: "Pagos", value: paidCount },
              ]}
            />
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Eventos publicados por semana</CardTitle>
          </CardHeader>
          <CardContent>
            <BarChart data={weeklyData} />
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eventos mais populares</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {popularEvents.map((event) => (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <span className="truncate">{event.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {event.interest_count} interessados
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Publicados recentemente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-1">
            {recentEvents.map((event) => (
              <Link
                key={event.id}
                href={`/eventos/${event.id}`}
                className="flex items-center justify-between gap-3 rounded-md px-2 py-2 text-sm hover:bg-secondary transition-colors"
              >
                <span className="truncate">{event.title}</span>
                <span className="shrink-0 text-xs text-muted-foreground">
                  {formatEventDateLong(event.created_at.slice(0, 10))}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

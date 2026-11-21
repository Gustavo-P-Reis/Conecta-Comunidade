import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarPlus } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { MyEventRow } from "@/components/events/my-event-row";

export const metadata = { title: "Meus eventos" };

export default async function MeusEventosPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/meus-eventos");

  const { data: events } = await supabase
    .from("events")
    .select("*")
    .eq("user_id", user.id)
    .order("event_date", { ascending: false });

  return (
    <div className="container-app py-10 lg:py-14">
      <PageHeader
        title="Meus eventos"
        description="Gerencie os eventos que você publicou."
        action={
          <Button asChild>
            <Link href="/criar-evento">
              <CalendarPlus className="size-4" /> Novo evento
            </Link>
          </Button>
        }
        className="mb-10"
      />

      {!events || events.length === 0 ? (
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
        <div className="flex flex-col gap-3">
          {events.map((event) => (
            <MyEventRow key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}

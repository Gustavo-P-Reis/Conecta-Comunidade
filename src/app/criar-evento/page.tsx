import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";

export const metadata = { title: "Divulgar um evento" };

export default async function CriarEventoPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/criar-evento");

  return (
    <div className="container-app max-w-2xl py-10 lg:py-14">
      <PageHeader
        title="Divulgue seu evento"
        description="Conte para a comunidade o que está acontecendo. Leva menos de 2 minutos."
        className="mb-8"
      />
      <EventForm mode="create" />
    </div>
  );
}

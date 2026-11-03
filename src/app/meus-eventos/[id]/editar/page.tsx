import { redirect, notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { EventForm } from "@/components/events/event-form";
import { PageHeader } from "@/components/shared/page-header";
import type { EventFormValues } from "@/lib/types";

export const metadata = { title: "Editar evento" };

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditarEventoPage({ params }: PageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect(`/login?proximo=/meus-eventos/${id}/editar`);

  const { data: event } = await supabase.from("events").select("*").eq("id", id).single();

  if (!event) notFound();
  if (event.user_id !== user.id) {
    redirect(`/eventos/${id}`);
  }

  const defaultValues: Partial<EventFormValues> = {
    title: event.title,
    description: event.description,
    category: event.category,
    event_date: event.event_date,
    event_time: event.event_time?.slice(0, 5),
    // eventos antigos chegam sem cidade/região: o formulário exige a classificação ao salvar
    city: event.city ?? undefined,
    region: event.region ?? undefined,
    location: event.location,
    neighborhood: event.neighborhood,
    address: event.address ?? "",
    is_free: event.is_free,
    price: event.price ?? undefined,
    capacity: event.capacity ?? undefined,
    organizer_name: event.organizer_name,
    contact: event.contact ?? "",
    image_url: event.image_url ?? "",
  };

  return (
    <div className="container-app max-w-2xl py-10 lg:py-14">
      <PageHeader
        title="Editar evento"
        description={`Alterando "${event.title}".`}
        className="mb-8"
      />
      <EventForm mode="edit" eventId={event.id} defaultValues={defaultValues} />
    </div>
  );
}

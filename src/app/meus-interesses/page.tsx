import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { attachViewerState } from "@/lib/queries";
import { PageHeader } from "@/components/shared/page-header";
import { EventGrid } from "@/components/events/event-grid";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { EventRow } from "@/lib/types";

export const metadata = { title: "Meus interesses" };

export default async function MeusInteressesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/meus-interesses");

  const [{ data: interestRows }, { data: favoriteRows }] = await Promise.all([
    supabase
      .from("interests")
      .select("event:events(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("favorites")
      .select("event:events(*)")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  const interestEvents = (interestRows ?? [])
    .map((r) => r.event)
    .filter(Boolean) as unknown as EventRow[];
  const favoriteEvents = (favoriteRows ?? [])
    .map((r) => r.event)
    .filter(Boolean) as unknown as EventRow[];

  const [interestsWithState, favoritesWithState] = await Promise.all([
    attachViewerState(supabase, interestEvents, user.id),
    attachViewerState(supabase, favoriteEvents, user.id),
  ]);

  return (
    <div className="container-app py-10 lg:py-14">
      <PageHeader
        title="Meus interesses"
        description="Os eventos que você marcou como interesse ou favoritou."
        className="mb-8"
      />

      <Tabs defaultValue="interesses">
        <TabsList>
          <TabsTrigger value="interesses">Tenho interesse ({interestsWithState.length})</TabsTrigger>
          <TabsTrigger value="favoritos">Favoritos ({favoritesWithState.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="interesses">
          <EventGrid
            events={interestsWithState}
            emptyTitle="Nenhum interesse registrado ainda"
            emptyDescription='Clique em "Tenho interesse" em um evento para acompanhá-lo aqui.'
          />
        </TabsContent>

        <TabsContent value="favoritos">
          <EventGrid
            events={favoritesWithState}
            emptyTitle="Nenhum favorito ainda"
            emptyDescription="Favorite eventos para encontrá-los rapidamente depois."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { BarChart } from "@/components/shared/bar-chart";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { RegionSummary } from "@/lib/geography";

function eventsLabel(count: number) {
  return `${count} ${count === 1 ? "evento" : "eventos"}`;
}

/** ["A"] -> "A" | ["A","B"] -> "A e B" | ["A","B","C"] -> "A, B e C" */
function joinNames(names: string[]) {
  if (names.length <= 1) return names.join("");
  const head = names.slice(0, -1).join(", ");
  const last = names[names.length - 1] ?? "";
  return `${head} e ${last}`;
}

/**
 * Gráfico "Eventos ativos por região" do painel administrativo.
 * Recebe o resumo já calculado por summarizeActiveEventsByRegion (src/lib/geography.ts),
 * a partir dos eventos reais do Supabase: só entram eventos publicados.
 */
export function RegionChart({ summary }: { summary: RegionSummary }) {
  const { regions, leaders, maxCount, otherCities, unclassified, totalActive } = summary;
  const leaderValues = new Set<string>(leaders.map((region) => region.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Eventos ativos por região</CardTitle>
        <CardDescription>
          Eventos publicados em cada região de São Paulo. Eventos removidos não entram na
          contagem.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        {totalActive === 0 ? (
          <p className="rounded-lg border border-dashed border-border-strong px-4 py-8 text-center text-sm text-muted-foreground">
            Ainda não há eventos ativos. Quando houver eventos publicados, a distribuição por
            região aparece aqui.
          </p>
        ) : (
          <>
            <p className="text-sm">
              {leaders.length > 0 ? (
                <>
                  <span className="text-muted-foreground">
                    {leaders.length > 1 ? "Maior concentração (empate): " : "Maior concentração: "}
                  </span>
                  <span className="font-medium text-accent">
                    {joinNames(leaders.map((region) => region.label))} — {eventsLabel(maxCount)}
                  </span>
                </>
              ) : (
                <span className="text-muted-foreground">
                  Nenhum evento ativo está classificado em uma região de São Paulo ainda.
                </span>
              )}
            </p>

            <BarChart
              strictZero
              data={regions.map((region) => ({
                label: region.label,
                value: region.count,
                colorClass: leaderValues.has(region.value) ? "bg-accent" : "bg-primary",
              }))}
            />

            <dl className="flex flex-col gap-2 border-t border-border pt-4 text-sm">
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Outras cidades (sem região)</dt>
                <dd className="font-medium tabular-nums">{otherCities}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4">
                <dt className="text-muted-foreground">Não informada (eventos antigos)</dt>
                <dd className="font-medium tabular-nums">{unclassified}</dd>
              </div>
              <div className="flex items-baseline justify-between gap-4 border-t border-border pt-2">
                <dt className="font-medium">Total de eventos ativos</dt>
                <dd className="font-medium tabular-nums">{totalActive}</dd>
              </div>
            </dl>

            {unclassified > 0 && (
              <p className="text-xs text-muted-foreground">
                &ldquo;Não informada&rdquo; reúne eventos criados antes da classificação por região.
                Para incluí-los no gráfico, o organizador precisa editar o evento e escolher a
                cidade (e a região, se for São Paulo).
              </p>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

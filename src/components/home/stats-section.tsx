import type { PlatformStats } from "@/lib/types";

export function StatsSection({ stats }: { stats: PlatformStats }) {
  const items = [
    { value: stats.totalEvents, label: "eventos publicados" },
    { value: stats.totalInterested, label: "pessoas participando" },
    { value: stats.totalCategories, label: "categorias" },
    { value: stats.totalCommunities, label: "bairros representados" },
  ];

  return (
    <section className="border-y border-border">
      <div className="container-app grid grid-cols-2 sm:grid-cols-4">
        {items.map((item, i) => (
          <div
            key={item.label}
            className="flex flex-col gap-1 py-8 pr-6 sm:py-10"
            style={{
              borderLeft: i === 0 ? "none" : "1px solid var(--color-border)",
              paddingLeft: i === 0 ? 0 : "1.5rem",
            }}
          >
            <span className="font-display text-3xl font-medium sm:text-4xl">
              {item.value.toLocaleString("pt-BR")}
            </span>
            <span className="text-sm text-muted-foreground">{item.label}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

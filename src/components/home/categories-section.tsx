import Link from "next/link";
import { CATEGORIES } from "@/lib/constants";

export function CategoriesSection({
  counts,
}: {
  counts: Record<string, number>;
}) {
  return (
    <section className="container-app py-16 lg:py-24">
      <div className="mb-10 flex flex-col gap-2">
        <h2 className="font-display text-3xl font-medium text-balance sm:text-4xl">
          Explore por categoria
        </h2>
        <p className="text-muted-foreground">
          Do futebol de fim de semana à oficina cultural — encontre o que combina com você.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {CATEGORIES.map((cat) => {
          const Icon = cat.icon;
          const count = counts[cat.value] ?? 0;
          return (
            <Link
              key={cat.value}
              href={`/explorar?category=${cat.value}`}
              className="group flex flex-col gap-4 rounded-lg border border-border bg-card p-5 transition-colors hover:border-primary/40 hover:bg-secondary"
            >
              <span className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </span>
              <div>
                <p className="font-medium">{cat.label}</p>
                <p className="text-sm text-muted-foreground">
                  {count} {count === 1 ? "evento" : "eventos"}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}

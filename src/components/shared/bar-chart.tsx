export function BarChart({
  data,
  strictZero = false,
}: {
  data: { label: string; value: number; colorClass?: string }[];
  /**
   * Opcional. Por padrão toda barra tem largura mínima de 3% (comportamento original,
   * usado pelos outros gráficos do painel). Com strictZero, valor 0 não desenha barra.
   */
  strictZero?: boolean;
}) {
  const max = Math.max(...data.map((d) => d.value), 1);

  return (
    <div className="flex flex-col gap-3">
      {data.map((item) => (
        <div key={item.label} className="grid grid-cols-[7rem_1fr_2.5rem] items-center gap-3 sm:grid-cols-[9rem_1fr_2.5rem]">
          <span className="truncate text-sm text-muted-foreground">{item.label}</span>
          <div className="h-2.5 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full rounded-full ${item.colorClass ?? "bg-primary"}`}
              style={{
                width: `${strictZero && item.value === 0 ? 0 : Math.max((item.value / max) * 100, 3)}%`,
              }}
            />
          </div>
          <span className="text-right text-sm font-medium tabular-nums">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

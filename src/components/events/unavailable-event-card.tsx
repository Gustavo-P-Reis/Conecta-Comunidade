import type { ReactNode } from "react";
import { CalendarX } from "lucide-react";

/**
 * Cartão para um interesse/favorito cujo evento deixou de estar disponível (excluído,
 * removido pela moderação ou fora do alcance da pessoa). Mantém o item na lista, para o
 * número exibido bater com os cartões, e deixa a pessoa remover o registro.
 */
export function UnavailableEventCard({ action }: { action?: ReactNode }) {
  return (
    <div className="flex flex-col overflow-hidden rounded-lg border border-dashed border-border-strong bg-card/60">
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-secondary/40 px-6 text-center">
        <span className="flex size-10 items-center justify-center rounded-full bg-secondary">
          <CalendarX className="size-5 text-muted-foreground" />
        </span>
        <p className="font-display text-base font-medium">Evento indisponível</p>
        <p className="text-xs text-muted-foreground">
          Este evento foi removido ou não está mais disponível.
        </p>
      </div>
      {action && <div className="p-3">{action}</div>}
    </div>
  );
}

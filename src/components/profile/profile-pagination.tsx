import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { profileListHref, type ProfileTab } from "@/lib/profile-lists";

/** Paginação por URL (?pagina=), no mesmo estilo da página Explorar. */
export function ProfilePagination({
  tab,
  page,
  totalPages,
}: {
  tab: ProfileTab;
  page: number;
  totalPages: number;
}) {
  if (totalPages <= 1) return null;

  const isFirst = page <= 1;
  const isLast = page >= totalPages;

  return (
    <nav aria-label="Paginação" className="mt-8 flex items-center justify-center gap-2">
      <Link
        href={profileListHref(tab, Math.max(1, page - 1))}
        aria-label="Página anterior"
        aria-disabled={isFirst}
        tabIndex={isFirst ? -1 : undefined}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-border-strong",
          isFirst ? "pointer-events-none opacity-40" : "hover:bg-card"
        )}
      >
        <ChevronLeft className="size-4" />
      </Link>
      <span className="px-3 text-sm text-muted-foreground">
        Página {page} de {totalPages}
      </span>
      <Link
        href={profileListHref(tab, Math.min(totalPages, page + 1))}
        aria-label="Próxima página"
        aria-disabled={isLast}
        tabIndex={isLast ? -1 : undefined}
        className={cn(
          "flex size-9 items-center justify-center rounded-full border border-border-strong",
          isLast ? "pointer-events-none opacity-40" : "hover:bg-card"
        )}
      >
        <ChevronRight className="size-4" />
      </Link>
    </nav>
  );
}

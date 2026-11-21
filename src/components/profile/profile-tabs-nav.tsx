import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  PROFILE_TABS,
  PROFILE_TAB_LABELS,
  profileListHref,
  type ProfileTab,
} from "@/lib/profile-lists";

/**
 * Abas do perfil. São links (a aba ativa vem da URL), então funcionam sem JavaScript,
 * ficam compartilháveis e respeitam o botão voltar. Rolam na horizontal em telas estreitas.
 */
export function ProfileTabsNav({
  active,
  counts,
}: {
  active: ProfileTab;
  counts: Record<ProfileTab, number>;
}) {
  return (
    <div className="-mx-1 overflow-x-auto px-1 pb-1">
      <nav
        aria-label="Seções do perfil"
        className="inline-flex h-11 w-max items-center gap-1 rounded-full border border-border bg-card p-1"
      >
        {PROFILE_TABS.map((tab) => {
          const isActive = tab === active;
          return (
            <Link
              key={tab}
              href={profileListHref(tab)}
              aria-current={isActive ? "page" : undefined}
              className={cn(
                "inline-flex h-9 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {PROFILE_TAB_LABELS[tab]}
              <span
                className={cn(
                  "rounded-full px-1.5 text-xs tabular-nums",
                  isActive ? "bg-primary-foreground/15" : "bg-secondary"
                )}
              >
                {counts[tab]}
              </span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

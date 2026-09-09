import Link from "next/link";
import Image from "next/image";
import { ArrowRight, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CategoryBadge } from "@/components/shared/category-badge";
import { formatEventDateLong } from "@/lib/utils";
import type { EventRow } from "@/lib/types";

export function Hero({ previewEvents }: { previewEvents: EventRow[] }) {
  const [first, second] = previewEvents;

  return (
    <section className="relative overflow-hidden bg-noise">
      <div className="container-app grid grid-cols-1 items-center gap-16 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
        <div className="flex flex-col items-start gap-6 [animation-fill-mode:both]">
          <span className="animate-fade-up rounded-full border border-border-strong bg-card px-4 py-1.5 text-sm text-muted-foreground [animation-delay:0ms]">
            Feito para o seu bairro
          </span>

          <h1 className="animate-fade-up font-display text-4xl font-medium leading-[1.08] text-balance sm:text-5xl lg:text-6xl [animation-delay:80ms]">
            O que está acontecendo na sua comunidade?
          </h1>

          <p className="animate-fade-up max-w-md text-lg text-muted-foreground [animation-delay:160ms]">
            Descubra eventos perto de você, encontre novas experiências e compartilhe o que
            está rolando no seu bairro.
          </p>

          <div className="animate-fade-up flex flex-col gap-3 sm:flex-row [animation-delay:240ms]">
            <Button size="lg" asChild>
              <Link href="/explorar">
                Explorar eventos <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link href="/criar-evento">Divulgar um evento</Link>
            </Button>
          </div>
        </div>

        <div className="animate-fade-up relative mx-auto w-full max-w-sm lg:mx-0 lg:max-w-none [animation-delay:200ms]">
          <div className="relative flex flex-col gap-4 sm:block sm:h-[26rem]">
            {first && (
              <div className="relative w-full overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elevated)] sm:absolute sm:left-0 sm:top-0 sm:w-[78%]">
                <div className="relative aspect-[4/3] w-full">
                  {first.image_url && (
                    <Image
                      src={first.image_url}
                      alt={first.title}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                  )}
                  <div className="absolute left-3 top-3">
                    <CategoryBadge category={first.category} />
                  </div>
                </div>
                <div className="p-4">
                  <p className="font-display text-lg font-medium leading-snug line-clamp-1">
                    {first.title}
                  </p>
                  <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="size-3.5" />
                    {first.neighborhood} · {formatEventDateLong(first.event_date)}
                  </p>
                </div>
              </div>
            )}

            {second && (
              <div className="relative w-[85%] self-end overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-elevated)] sm:absolute sm:bottom-0 sm:right-0 sm:w-[62%] sm:rotate-[2deg]">
                <div className="relative aspect-[4/3] w-full">
                  {second.image_url && (
                    <Image
                      src={second.image_url}
                      alt={second.title}
                      fill
                      sizes="320px"
                      className="object-cover"
                    />
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-display text-base font-medium leading-snug line-clamp-1">
                    {second.title}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {second.interest_count}{" "}
                    {second.interest_count === 1 ? "interessado" : "interessados"}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

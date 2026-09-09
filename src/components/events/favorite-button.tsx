"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { toggleFavorite } from "@/lib/actions/events";
import { cn } from "@/lib/utils";

export function FavoriteButton({
  eventId,
  initialFavorited,
  variant = "icon",
  className,
}: {
  eventId: string;
  initialFavorited: boolean;
  variant?: "icon" | "full";
  className?: string;
}) {
  const router = useRouter();
  const [favorited, setFavorited] = React.useState(initialFavorited);
  const [pending, setPending] = React.useState(false);

  async function handleClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;

    setPending(true);
    const next = !favorited;
    setFavorited(next); // otimista

    const result = await toggleFavorite(eventId);

    if (!result.success) {
      setFavorited(!next); // reverte
      if (result.requiresAuth) {
        toast.error("Entre na sua conta para favoritar eventos.");
        router.push(`/login?proximo=/eventos/${eventId}`);
      }
    } else {
      toast.success(next ? "Adicionado aos favoritos." : "Removido dos favoritos.");
    }
    setPending(false);
  }

  if (variant === "full") {
    return (
      <button
        onClick={handleClick}
        disabled={pending}
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-5 py-2.5 text-sm font-medium transition-colors cursor-pointer",
          favorited
            ? "border-transparent bg-accent-soft text-accent"
            : "border-border-strong text-foreground hover:bg-card",
          className
        )}
      >
        <Heart className={cn("size-4", favorited && "fill-accent")} />
        {favorited ? "Favoritado" : "Favoritar"}
      </button>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      aria-label={favorited ? "Remover dos favoritos" : "Adicionar aos favoritos"}
      aria-pressed={favorited}
      className={cn(
        "flex size-9 items-center justify-center rounded-full bg-background/70 backdrop-blur-sm border border-border-strong text-foreground transition-all hover:scale-105 cursor-pointer",
        className
      )}
    >
      <Heart
        className={cn(
          "size-4 transition-colors",
          favorited ? "fill-accent text-accent" : "text-foreground"
        )}
      />
    </button>
  );
}

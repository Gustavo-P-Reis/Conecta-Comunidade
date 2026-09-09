"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";

export function ShareButton({ title, path }: { title: string; path: string }) {
  async function handleShare() {
    const url = `${window.location.origin}${path}`;

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch {
        // usuário cancelou o compartilhamento — nada a fazer
      }
      return;
    }

    await navigator.clipboard.writeText(url);
    toast.success("Link copiado!");
  }

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium hover:bg-card transition-colors cursor-pointer"
    >
      <Share2 className="size-4" />
      Compartilhar
    </button>
  );
}

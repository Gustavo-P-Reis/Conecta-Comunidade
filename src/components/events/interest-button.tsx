"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, HandHeart } from "lucide-react";
import { toast } from "sonner";
import { toggleInterest } from "@/lib/actions/events";
import { cn } from "@/lib/utils";

export function InterestButton({
  eventId,
  initialInterested,
  initialCount,
}: {
  eventId: string;
  initialInterested: boolean;
  initialCount: number;
}) {
  const router = useRouter();
  const [interested, setInterested] = React.useState(initialInterested);
  const [count, setCount] = React.useState(initialCount);
  const [pending, setPending] = React.useState(false);

  async function handleClick() {
    if (pending) return;
    setPending(true);

    const next = !interested;
    setInterested(next);
    setCount((c) => c + (next ? 1 : -1));

    const result = await toggleInterest(eventId);

    if (!result.success) {
      setInterested(!next);
      setCount((c) => c + (next ? -1 : 1));
      if (result.requiresAuth) {
        toast.error("Entre na sua conta para demonstrar interesse.");
        router.push(`/login?proximo=/eventos/${eventId}`);
      }
    } else {
      setCount(result.interestCount);
      toast.success(
        result.hasInterest ? "Interesse registrado!" : "Interesse removido."
      );
    }
    setPending(false);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        onClick={handleClick}
        disabled={pending}
        aria-pressed={interested}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium transition-colors cursor-pointer",
          interested
            ? "bg-primary/15 text-primary border border-primary/30"
            : "bg-primary text-primary-foreground hover:bg-primary-deep"
        )}
      >
        {interested ? <CheckCircle2 className="size-4" /> : <HandHeart className="size-4" />}
        {interested ? "Interesse registrado" : "Tenho interesse"}
      </button>
      <p className="text-sm text-muted-foreground text-center">
        {count} {count === 1 ? "pessoa tem" : "pessoas têm"} interesse
      </p>
    </div>
  );
}

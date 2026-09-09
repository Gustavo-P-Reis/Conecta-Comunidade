"use client";

import { useEffect } from "react";
import { RotateCw, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container-app flex min-h-[60vh] flex-col items-center justify-center gap-4 py-24 text-center">
      <span className="flex size-12 items-center justify-center rounded-full bg-destructive-soft text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <h1 className="font-display text-2xl font-medium">
        Não foi possível carregar esta página
      </h1>
      <p className="max-w-sm text-muted-foreground">
        Algo deu errado do nosso lado. Tente novamente em instantes.
      </p>
      <Button onClick={() => reset()}>
        <RotateCw className="size-4" /> Tentar novamente
      </Button>
    </div>
  );
}

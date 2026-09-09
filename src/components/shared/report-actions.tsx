"use client";

import * as React from "react";
import { CheckCircle2, Loader2, ShieldOff } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { resolveReport, removeReportedEvent } from "@/lib/actions/reports";

export function ReportActions({
  reportId,
  eventId,
  eventTitle,
  eventAlreadyRemoved,
}: {
  reportId: string;
  eventId: string;
  eventTitle: string;
  eventAlreadyRemoved: boolean;
}) {
  const [pending, setPending] = React.useState(false);

  async function handleResolve() {
    setPending(true);
    const result = await resolveReport(reportId);
    setPending(false);

    if (result.success) {
      toast.success("Denúncia marcada como resolvida.");
    } else {
      toast.error(result.message ?? "Não foi possível atualizar a denúncia.");
    }
  }

  async function handleRemoveEvent() {
    setPending(true);
    const result = await removeReportedEvent(eventId, reportId);
    setPending(false);

    if (result.success) {
      toast.success("Evento removido e denúncia resolvida.");
    } else {
      toast.error(result.message ?? "Não foi possível remover o evento.");
    }
  }

  return (
    <div className="flex shrink-0 gap-2">
      <Button variant="outline" size="sm" onClick={handleResolve} disabled={pending}>
        {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
        Marcar resolvida
      </Button>

      {!eventAlreadyRemoved && (
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" disabled={pending}>
              <ShieldOff className="size-4" /> Remover evento
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remover &ldquo;{eventTitle}&rdquo;?</AlertDialogTitle>
              <AlertDialogDescription>
                O evento deixará de aparecer publicamente na plataforma. Essa ação pode ser
                revertida apenas diretamente no banco de dados.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={handleRemoveEvent}>Remover evento</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

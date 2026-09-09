"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { REPORT_REASONS, type ReportReason } from "@/lib/constants";
import { submitReport } from "@/lib/actions/reports";

export function ReportDialog({
  eventId,
  isAuthenticated,
}: {
  eventId: string;
  isAuthenticated: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState<ReportReason>("informacao_falsa");
  const [description, setDescription] = React.useState("");
  const [pending, setPending] = React.useState(false);

  function handleTriggerClick(e: React.MouseEvent) {
    if (!isAuthenticated) {
      e.preventDefault();
      toast.error("Entre na sua conta para denunciar um evento.");
      router.push(`/login?proximo=/eventos/${eventId}`);
    }
  }

  async function handleSubmit() {
    setPending(true);
    const result = await submitReport(eventId, { reason, description });
    setPending(false);

    if (result.success) {
      toast.success("Denúncia enviada. Nossa equipe vai avaliar.");
      setOpen(false);
      setDescription("");
    } else {
      toast.error(result.message ?? "Não foi possível enviar a denúncia.");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          onClick={handleTriggerClick}
          className="inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-colors cursor-pointer"
        >
          <Flag className="size-4" />
          Denunciar
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Denunciar evento</DialogTitle>
          <DialogDescription>
            Conte o que há de errado com este evento. Nossa equipe vai revisar a denúncia.
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={reason} onValueChange={(v) => setReason(v as ReportReason)}>
          {REPORT_REASONS.map((r) => (
            <div key={r.value} className="flex items-center gap-2.5">
              <RadioGroupItem value={r.value} id={`reason-${r.value}`} />
              <Label htmlFor={`reason-${r.value}`} className="cursor-pointer font-normal">
                {r.label}
              </Label>
            </div>
          ))}
        </RadioGroup>

        <div className="flex flex-col gap-2">
          <Label htmlFor="report-description">Detalhes (opcional)</Label>
          <Textarea
            id="report-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descreva o problema com mais detalhes, se quiser."
            maxLength={500}
            className="min-h-20"
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button variant="destructive" onClick={handleSubmit} disabled={pending}>
            {pending && <Loader2 className="size-4 animate-spin" />}
            Enviar denúncia
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

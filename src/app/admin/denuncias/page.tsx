import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/shared/page-header";
import { EmptyState } from "@/components/shared/empty-state";
import { Badge } from "@/components/ui/badge";
import { ReportActions } from "@/components/shared/report-actions";
import { REPORT_REASONS } from "@/lib/constants";
import { formatEventDateLong } from "@/lib/utils";

export const metadata = { title: "Denúncias" };

export default async function AdminDenunciasPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?proximo=/admin/denuncias");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") redirect("/");

  const { data: reports } = await supabase
    .from("reports")
    .select("id, reason, description, status, created_at, event:events(id, title, image_url, status)")
    .order("status", { ascending: true })
    .order("created_at", { ascending: false });

  return (
    <div className="container-app py-10 lg:py-14">
      <PageHeader
        title="Denúncias"
        description="Avalie os eventos denunciados pela comunidade."
        className="mb-10"
      />

      {!reports || reports.length === 0 ? (
        <EmptyState
          icon={ShieldCheck}
          title="Nenhuma denúncia por aqui"
          description="Quando alguém denunciar um evento, ele aparece nesta página."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {reports.map((report) => {
            const event = Array.isArray(report.event) ? report.event[0] : report.event;
            const reasonLabel =
              REPORT_REASONS.find((r) => r.value === report.reason)?.label ?? report.reason;

            return (
              <div
                key={report.id}
                className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0 flex-1">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    {event ? (
                      <Link
                        href={`/eventos/${event.id}`}
                        className="font-medium hover:text-primary transition-colors truncate"
                      >
                        {event.title}
                      </Link>
                    ) : (
                      <span className="text-muted-foreground italic">Evento excluído</span>
                    )}
                    <Badge variant={report.status === "pending" ? "accent" : "secondary"}>
                      {report.status === "pending" ? "Pendente" : "Resolvida"}
                    </Badge>
                    {event?.status === "removed" && (
                      <Badge variant="destructive">Evento removido</Badge>
                    )}
                  </div>
                  <p className="text-sm text-foreground">
                    Motivo: <span className="text-muted-foreground">{reasonLabel}</span>
                  </p>
                  {report.description && (
                    <p className="mt-1 text-sm text-muted-foreground">{report.description}</p>
                  )}
                  <p className="mt-1 text-xs text-muted-foreground">
                    Denunciado em {formatEventDateLong(report.created_at.slice(0, 10))}
                  </p>
                </div>

                {report.status === "pending" && event && (
                  <ReportActions
                    reportId={report.id}
                    eventId={event.id}
                    eventTitle={event.title}
                    eventAlreadyRemoved={event.status === "removed"}
                  />
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

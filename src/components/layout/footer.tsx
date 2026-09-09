import Link from "next/link";
import { CalendarHeart } from "lucide-react";
import { SITE_NAME, SITE_TAGLINE } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="border-t border-border mt-24">
      <div className="container-app py-12 flex flex-col gap-8 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2 max-w-xs">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
              <CalendarHeart className="size-3.5" />
            </span>
            <span className="font-display text-base font-medium">{SITE_NAME}</span>
          </Link>
          <p className="text-sm text-muted-foreground">{SITE_TAGLINE}</p>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-6">
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium text-foreground">Plataforma</p>
            <Link href="/explorar" className="text-sm text-muted-foreground hover:text-foreground">
              Explorar eventos
            </Link>
            <Link href="/criar-evento" className="text-sm text-muted-foreground hover:text-foreground">
              Divulgar um evento
            </Link>
          </div>
          <div className="flex flex-col gap-2.5">
            <p className="text-sm font-medium text-foreground">Conta</p>
            <Link href="/login" className="text-sm text-muted-foreground hover:text-foreground">
              Entrar
            </Link>
            <Link href="/cadastro" className="text-sm text-muted-foreground hover:text-foreground">
              Criar conta
            </Link>
          </div>
        </div>
      </div>
      <div className="container-app pb-8">
        <p className="text-xs text-muted-foreground">
          {SITE_NAME} — projeto acadêmico de Trabalho de Conclusão de Curso.
        </p>
      </div>
    </footer>
  );
}

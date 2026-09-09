"use client";

import * as React from "react";
import Link from "next/link";
import { KeyRound, Loader2, MailCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function RecuperarSenhaPage() {
  const supabase = createClient();
  const [email, setEmail] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/atualizar-senha`,
    });

    // Sempre mostramos a mesma mensagem, exista ou não uma conta com esse
    // e-mail — evita confirmar para terceiros quais e-mails têm cadastro.
    setSubmitting(false);
    setSent(true);
  }

  if (sent) {
    return (
      <div className="container-app flex min-h-[80vh] items-center justify-center py-16">
        <div className="flex w-full max-w-sm flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MailCheck className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-medium">Verifique seu e-mail</h1>
          <p className="text-sm text-muted-foreground">
            Se houver uma conta com o e-mail {email}, enviamos um link para redefinir a senha.
          </p>
          <Button variant="outline" asChild className="mt-2">
            <Link href="/login">Voltar para o login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container-app flex min-h-[80vh] items-center justify-center py-16">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
            <KeyRound className="size-5" />
          </span>
          <h1 className="font-display text-2xl font-medium">Recuperar senha</h1>
          <p className="text-sm text-muted-foreground">
            Informe seu e-mail e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              required
              placeholder="voce@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <Button type="submit" disabled={submitting} className="mt-2">
            {submitting && <Loader2 className="size-4 animate-spin" />}
            Enviar link de recuperação
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          Lembrou a senha?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Entrar
          </Link>
        </p>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, User, LogOut, PlusCircle, CalendarHeart, ShieldCheck } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getInitials, cn } from "@/lib/utils";
import { SITE_NAME } from "@/lib/constants";
import type { Profile } from "@/lib/types";

const NAV_LINKS = [
  { href: "/", label: "Início" },
  { href: "/explorar", label: "Explorar" },
  { href: "/criar-evento", label: "Criar evento" },
  { href: "/meus-eventos", label: "Meus eventos" },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [profile, setProfile] = React.useState<Profile | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [mobileOpen, setMobileOpen] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    async function loadProfile() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!active) return;

      if (!user) {
        setProfile(null);
        setLoading(false);
        return;
      }

      const { data } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (active) {
        setProfile(data);
        setLoading(false);
      }
    }

    loadProfile();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadProfile();
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="container-app flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <CalendarHeart className="size-4" />
          </span>
          <span className="font-display text-lg font-medium tracking-tight">
            {SITE_NAME}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map((link) => {
            const active =
              link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-card text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden md:block">
            {loading ? (
              <div className="size-9 rounded-full bg-secondary animate-pulse" />
            ) : profile ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 rounded-full p-1 pr-3 border border-transparent hover:border-border-strong transition-colors cursor-pointer">
                    <Avatar>
                      <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name} />
                      <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-medium max-w-[9rem] truncate">
                      {profile.name}
                    </span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link href="/perfil">
                      <User /> Perfil
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/meus-eventos">
                      <CalendarHeart /> Meus eventos
                    </Link>
                  </DropdownMenuItem>
                  {profile.role === "admin" && (
                    <DropdownMenuItem asChild>
                      <Link href="/admin">
                        <ShieldCheck /> Administração
                      </Link>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={handleSignOut}>
                    <LogOut /> Sair
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link href="/cadastro">Criar conta</Link>
                </Button>
              </div>
            )}
          </div>

          <button
            onClick={() => setMobileOpen(true)}
            className="md:hidden flex size-10 items-center justify-center rounded-full hover:bg-card transition-colors cursor-pointer"
            aria-label="Abrir menu"
          >
            <Menu className="size-5" />
          </button>
        </div>
      </div>

      <Dialog open={mobileOpen} onOpenChange={setMobileOpen}>
        <DialogContent
          showClose={false}
          className="left-auto right-0 top-0 h-dvh max-h-dvh w-[85vw] max-w-sm translate-x-0 translate-y-0 rounded-none border-l border-border data-[state=open]:animate-none flex flex-col gap-6"
        >
          <div className="flex items-center justify-between">
            <DialogTitle>{SITE_NAME}</DialogTitle>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex size-9 items-center justify-center rounded-full hover:bg-card cursor-pointer"
              aria-label="Fechar menu"
            >
              <X className="size-5" />
            </button>
          </div>

          <nav className="flex flex-col gap-1">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-lg px-3 py-3 text-base font-medium hover:bg-card transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="mt-auto flex flex-col gap-2 border-t border-border pt-6">
            {profile ? (
              <>
                <Link
                  href="/perfil"
                  className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-card transition-colors"
                >
                  <Avatar>
                    <AvatarImage src={profile.avatar_url ?? undefined} alt={profile.name} />
                    <AvatarFallback>{getInitials(profile.name)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{profile.name}</p>
                    <p className="text-xs text-muted-foreground">Ver perfil</p>
                  </div>
                </Link>
                <Link
                  href="/meus-interesses"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card transition-colors"
                >
                  Meus interesses
                </Link>
                {profile.role === "admin" && (
                  <Link
                    href="/admin"
                    className="rounded-lg px-3 py-2.5 text-sm font-medium hover:bg-card transition-colors"
                  >
                    Administração
                  </Link>
                )}
                <Button variant="outline" onClick={handleSignOut} className="mt-2">
                  <LogOut /> Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline" asChild>
                  <Link href="/login">Entrar</Link>
                </Button>
                <Button asChild>
                  <Link href="/cadastro">
                    <PlusCircle /> Criar conta
                  </Link>
                </Button>
              </>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </header>
  );
}

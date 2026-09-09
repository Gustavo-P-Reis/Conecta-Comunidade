import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

/**
 * Cliente Supabase para uso em Server Components, Server Actions e Route
 * Handlers. Lê e escreve a sessão via cookies do Next.js.
 *
 * Em Server Components puros a escrita de cookies não é permitida pelo
 * Next.js — o catch abaixo ignora esse erro porque, nesse caso, o
 * middleware (src/middleware.ts) já cuida de renovar a sessão a cada
 * requisição.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado a partir de um Server Component — pode ser ignorado
            // porque o middleware já renova a sessão em toda requisição.
          }
        },
      },
    }
  );
}

/** Busca o usuário autenticado (verificado com o servidor de auth) e seu
 * perfil. Retorna null se não houver sessão válida. Use isso — nunca
 * getSession() — em código de servidor que decide autorização. */
export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return profile ? { authUser: user, profile } : null;
}

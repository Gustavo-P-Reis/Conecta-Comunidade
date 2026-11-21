import { redirect } from "next/navigation";

/**
 * As listas de interesses e favoritos agora ficam no perfil (/perfil). A rota antiga
 * continua funcionando (menu mobile, links salvos) e leva para a aba correspondente.
 */
export default function MeusInteressesPage() {
  redirect("/perfil?aba=interesses");
}

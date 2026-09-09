import {
  Palette,
  Trophy,
  GraduationCap,
  Music2,
  HeartHandshake,
  Leaf,
  PartyPopper,
  Sparkles,
  type LucideIcon,
} from "lucide-react";

export type CategoryValue =
  | "cultura"
  | "esportes"
  | "educacao"
  | "musica"
  | "acoes_sociais"
  | "meio_ambiente"
  | "lazer"
  | "outros";

export interface CategoryMeta {
  value: CategoryValue;
  label: string;
  icon: LucideIcon;
}

export const CATEGORIES: CategoryMeta[] = [
  { value: "cultura", label: "Cultura", icon: Palette },
  { value: "esportes", label: "Esportes", icon: Trophy },
  { value: "educacao", label: "Educação", icon: GraduationCap },
  { value: "musica", label: "Música", icon: Music2 },
  { value: "acoes_sociais", label: "Ações sociais", icon: HeartHandshake },
  { value: "meio_ambiente", label: "Meio ambiente", icon: Leaf },
  { value: "lazer", label: "Lazer", icon: PartyPopper },
  { value: "outros", label: "Outros", icon: Sparkles },
];

export function getCategoryMeta(value: string): CategoryMeta {
  return (
    CATEGORIES.find((c) => c.value === value) ?? {
      value: "outros",
      label: "Outros",
      icon: Sparkles,
    }
  );
}

export type ReportReason =
  | "informacao_falsa"
  | "spam"
  | "conteudo_inadequado"
  | "evento_inexistente"
  | "outro";

export const REPORT_REASONS: { value: ReportReason; label: string }[] = [
  { value: "informacao_falsa", label: "Informação falsa" },
  { value: "spam", label: "Spam" },
  { value: "conteudo_inadequado", label: "Conteúdo inadequado" },
  { value: "evento_inexistente", label: "Evento inexistente" },
  { value: "outro", label: "Outro" },
];

export const SORT_OPTIONS = [
  { value: "recentes", label: "Mais recentes" },
  { value: "populares", label: "Mais populares" },
  { value: "proximos", label: "Mais próximos (data)" },
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number]["value"];

export const EVENTS_PER_PAGE = 12;

export const SITE_NAME = "Conecta Comunidade";
export const SITE_TAGLINE = "Descubra. Divulgue. Participe.";
export const SITE_DESCRIPTION =
  "Plataforma colaborativa para divulgação e descoberta de eventos comunitários locais.";

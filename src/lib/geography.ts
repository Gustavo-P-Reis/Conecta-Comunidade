/**
 * Classificação geográfica dos eventos: CIDADE + REGIÃO.
 *
 * - Cidade: município onde o evento acontece. Hoje: "São Paulo" ou "Outra cidade".
 * - Região: divisão usada para agrupar e comparar eventos no painel administrativo.
 *   Só existe para cidades que tenham regiões cadastradas (hoje, apenas São Paulo).
 *   Em "Outra cidade" a região NÃO se aplica e fica vazia.
 * - Eventos antigos (criados antes desta classificação) têm cidade e região vazias e
 *   são tratados como "Não informada": nunca são atribuídos a uma região.
 * - Bairro, local e endereço continuam sendo campos separados e não entram aqui.
 *
 * Este arquivo é "puro" (sem React, Supabase ou ícones): o formulário, o Zod, as
 * Server Actions e o painel admin usam exatamente o mesmo catálogo.
 *
 * Para ampliar a cobertura: inclua a cidade em CITY_VALUES, CITY_LABELS e
 * REGIONS_BY_CITY (e as novas regiões em REGION_VALUES e REGION_LABELS) e amplie o
 * CHECK "events_geo_check" numa nova migração. Mantenha os códigos idênticos aos do SQL.
 */

export const CITY_VALUES = ["sao_paulo", "outra"] as const;
export type CityValue = (typeof CITY_VALUES)[number];

export const REGION_VALUES = [
  "centro",
  "zona_norte",
  "zona_sul",
  "zona_leste",
  "zona_oeste",
] as const;
export type RegionValue = (typeof REGION_VALUES)[number];

export const CITY_LABELS: Record<CityValue, string> = {
  sao_paulo: "São Paulo",
  outra: "Outra cidade",
};

export const REGION_LABELS: Record<RegionValue, string> = {
  centro: "Centro",
  zona_norte: "Zona Norte",
  zona_sul: "Zona Sul",
  zona_leste: "Zona Leste",
  zona_oeste: "Zona Oeste",
};

/** Regiões de cada cidade. Lista vazia = a cidade não usa regiões. */
export const REGIONS_BY_CITY: Record<CityValue, readonly RegionValue[]> = {
  sao_paulo: REGION_VALUES,
  outra: [],
};

export const CITY_OPTIONS = CITY_VALUES.map((value) => ({
  value,
  label: CITY_LABELS[value],
}));

export const REGION_OPTIONS = REGION_VALUES.map((value) => ({
  value,
  label: REGION_LABELS[value],
}));

export function isCityValue(value: unknown): value is CityValue {
  return typeof value === "string" && (CITY_VALUES as readonly string[]).includes(value);
}

function regionsOf(city: string): readonly string[] {
  return Object.prototype.hasOwnProperty.call(REGIONS_BY_CITY, city)
    ? REGIONS_BY_CITY[city as CityValue]
    : [];
}

/** A cidade informada usa regiões? (hoje, só São Paulo) */
export function cityUsesRegions(city: string | null | undefined): boolean {
  return !!city && regionsOf(city).length > 0;
}

/**
 * Região que deve ser gravada: só vale se a cidade usa regiões e a região pertence a
 * ela. Caso contrário devolve null (ex.: "Outra cidade" nunca recebe região).
 */
export function normalizeRegion(
  city: string | null | undefined,
  region: string | null | undefined
): RegionValue | null {
  if (!city || !region) return null;
  return regionsOf(city).includes(region) ? (region as RegionValue) : null;
}

/* -------------------------------------------------------------------------- */
/* Contagem de eventos ativos por região (usada no painel administrativo)      */
/* -------------------------------------------------------------------------- */

export interface GeoEventInput {
  status?: string | null;
  city?: string | null;
  region?: string | null;
}

export interface RegionCount {
  value: RegionValue;
  label: string;
  count: number;
}

export interface RegionSummary {
  /** Todas as regiões, da maior para a menor quantidade (empate: ordem do catálogo). */
  regions: RegionCount[];
  /** Região(ões) com a maior quantidade; mais de uma em caso de empate; vazio se todas forem 0. */
  leaders: RegionCount[];
  maxCount: number;
  /** Eventos ativos em cidades sem regiões ("Outra cidade"). */
  otherCities: number;
  /** Eventos ativos sem classificação (eventos antigos ou dados incompletos). */
  unclassified: number;
  /** Todos os eventos ativos: regiões + outras cidades + não informada. */
  totalActive: number;
}

/**
 * Conta eventos ATIVOS (status "published"; removidos não entram) por região.
 * Cada evento é contado uma única vez, em um único grupo:
 *   - região de uma cidade que usa regiões (hoje, as 5 de São Paulo);
 *   - "outras cidades" (cidade conhecida que não usa regiões, sem região);
 *   - "não informada" (sem cidade/região, ou dado incompleto/inconsistente).
 */
export function summarizeActiveEventsByRegion(
  events: readonly GeoEventInput[]
): RegionSummary {
  const counts = Object.fromEntries(
    REGION_VALUES.map((value) => [value, 0])
  ) as Record<RegionValue, number>;
  let otherCities = 0;
  let unclassified = 0;
  let totalActive = 0;

  for (const event of events) {
    if (event.status !== "published") continue;
    totalActive += 1;

    const region = normalizeRegion(event.city, event.region);
    if (region) {
      counts[region] += 1;
    } else if (isCityValue(event.city) && !cityUsesRegions(event.city) && !event.region) {
      otherCities += 1;
    } else {
      unclassified += 1;
    }
  }

  const regions: RegionCount[] = REGION_VALUES.map((value, index) => ({
    value,
    label: REGION_LABELS[value],
    count: counts[value],
    index,
  }))
    .sort((a, b) => b.count - a.count || a.index - b.index)
    .map(({ value, label, count }) => ({ value, label, count }));

  const maxCount = regions.reduce((max, region) => Math.max(max, region.count), 0);
  const leaders = maxCount > 0 ? regions.filter((region) => region.count === maxCount) : [];

  return { regions, leaders, maxCount, otherCities, unclassified, totalActive };
}

import type { CategoryValue, ReportReason } from "@/lib/constants";
import type { CityValue, RegionValue } from "@/lib/geography";

export interface Profile {
  id: string;
  name: string;
  email: string;
  avatar_url: string | null;
  role: "user" | "admin";
  created_at: string;
  updated_at: string;
}

export interface EventRow {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: CategoryValue;
  event_date: string; // ISO date, YYYY-MM-DD
  event_time: string; // HH:MM:SS
  location: string;
  neighborhood: string;
  address: string | null;
  /** null = evento antigo, ainda sem classificação ("Não informada") */
  city: CityValue | null;
  /** só existe quando a cidade usa regiões (hoje, São Paulo); null caso contrário */
  region: RegionValue | null;
  is_free: boolean;
  price: number | null;
  image_url: string | null;
  /** ID (11 caracteres) do vídeo de apresentação no YouTube; null = sem vídeo */
  youtube_video_id: string | null;
  capacity: number | null;
  organizer_name: string;
  contact: string | null;
  status: "published" | "removed";
  interest_count: number;
  favorite_count: number;
  created_at: string;
  updated_at: string;
}

/** Evento com metadados calculados no cliente (se o usuário atual já demonstrou
 * interesse / favoritou), usados nas páginas que precisam desse estado. */
export interface EventWithViewerState extends EventRow {
  viewer_has_interest?: boolean;
  viewer_has_favorite?: boolean;
}

export interface Interest {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export interface Favorite {
  id: string;
  user_id: string;
  event_id: string;
  created_at: string;
}

export interface Report {
  id: string;
  user_id: string;
  event_id: string;
  reason: ReportReason;
  description: string | null;
  status: "pending" | "resolved";
  created_at: string;
  // presente apenas quando a denúncia é carregada junto do evento (admin)
  event?: Pick<EventRow, "id" | "title" | "image_url" | "status"> | null;
}

export interface EventFormValues {
  title: string;
  description: string;
  category: CategoryValue;
  event_date: string;
  event_time: string;
  city: CityValue;
  region?: RegionValue;
  location: string;
  neighborhood: string;
  address?: string;
  is_free: boolean;
  price?: number;
  capacity?: number;
  organizer_name: string;
  contact?: string;
  image_url?: string;
  /** Link do YouTube colado pelo organizador (o servidor extrai o ID). undefined = não alterado */
  video_url?: string;
}

export interface ExploreFilters {
  q?: string;
  category?: CategoryValue;
  date?: string;
  price?: "gratuito" | "pago";
  sort?: string;
  page?: number;
}

export interface PlatformStats {
  totalEvents: number;
  totalInterested: number;
  totalCategories: number;
  totalCommunities: number;
}

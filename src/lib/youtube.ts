/**
 * Vídeo de apresentação do evento (YouTube).
 *
 * O organizador cola um link do YouTube; só o ID (11 caracteres) é guardado no banco
 * (events.youtube_video_id) e só ele é usado para montar o player. Nenhuma URL ou HTML
 * fornecido pelo usuário chega ao iframe.
 *
 * Módulo "puro" (sem React, Supabase ou rede): é usado pelo Zod (formulário), pelas
 * Server Actions (validação autoritativa), pelo formulário, pela página do evento e pelos
 * testes. Não depende de chave de API nem faz requisições ao YouTube.
 */

/** ID de vídeo do YouTube: exatamente 11 caracteres. Igual ao CHECK da migração 003. */
export const YOUTUBE_ID_PATTERN = /^[A-Za-z0-9_-]{11}$/;
export const YOUTUBE_URL_MAX_LENGTH = 300;

// Hosts aceitos, comparados de forma EXATA (nunca "termina com"), para barrar domínios
// parecidos como youtube.com.evil.com, evilyoutube.com ou music.youtube.com.
const YOUTUBE_HOSTS = new Set(["youtube.com", "www.youtube.com", "m.youtube.com"]);
const NOCOOKIE_HOSTS = new Set(["youtube-nocookie.com", "www.youtube-nocookie.com"]);
const SHORT_HOST = "youtu.be";

/** Formatos youtube.com/<prefixo>/ID aceitos (embed, Shorts, transmissões e o formato antigo /v/). */
const YOUTUBE_ID_PATH_PREFIXES = new Set(["embed", "shorts", "live", "v"]);

export function isValidYouTubeId(value: unknown): value is string {
  return typeof value === "string" && YOUTUBE_ID_PATTERN.test(value);
}

function hasWhitespaceOrControl(text: string): boolean {
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i);
    if (code <= 0x20 || code === 0x7f) return true; // espaço e caracteres de controle
  }
  return /\s/.test(text); // espaços Unicode (ex.: NBSP)
}

/**
 * Extrai o ID de um link do YouTube. Devolve null para qualquer coisa que não seja um
 * link reconhecido: outros sites, esquemas perigosos (javascript:, data:), links com
 * usuário/senha/porta, canais, playlists sem vídeo, IDs com tamanho ou caracteres errados.
 * Todos os demais parâmetros do link (t, si, list, feature...) são descartados.
 */
export function extractYouTubeId(input: unknown): string | null {
  if (typeof input !== "string") return null;

  const raw = input.trim();
  if (raw === "" || raw.length > YOUTUBE_URL_MAX_LENGTH) return null;
  if (hasWhitespaceOrControl(raw)) return null; // não é um link único

  // Sem esquema ("youtu.be/ID", "youtube.com/watch?v=ID"): assume https.
  const hasScheme = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw);
  let url: URL;
  try {
    url = new URL(hasScheme ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  if (url.protocol !== "https:" && url.protocol !== "http:") return null;
  if (url.username !== "" || url.password !== "" || url.port !== "") return null;

  const host = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter((segment) => segment !== "");
  let candidate: string | null | undefined;

  if (host === SHORT_HOST) {
    if (segments.length === 1) candidate = segments[0];
  } else if (YOUTUBE_HOSTS.has(host)) {
    const first = segments[0];
    if (segments.length === 1 && first === "watch") {
      candidate = url.searchParams.get("v");
    } else if (
      segments.length === 2 &&
      first !== undefined &&
      YOUTUBE_ID_PATH_PREFIXES.has(first)
    ) {
      candidate = segments[1];
    }
  } else if (NOCOOKIE_HOSTS.has(host)) {
    if (segments.length === 2 && segments[0] === "embed") candidate = segments[1];
  }

  return isValidYouTubeId(candidate) ? candidate : null;
}

/* -------------------------------------------------------------------------- */
/* Estado do campo / semântica de gravação (criação e edição)                  */
/* -------------------------------------------------------------------------- */

export type YouTubeInputState =
  | { status: "empty" }
  | { status: "valid"; id: string }
  | { status: "invalid" };

/** Classifica o texto do campo: vazio (sem vídeo), link válido (com ID) ou inválido. */
export function parseYouTubeInput(input: unknown): YouTubeInputState {
  if (input === undefined || input === null) return { status: "empty" };
  if (typeof input !== "string") return { status: "invalid" };
  if (input.trim() === "") return { status: "empty" };
  const id = extractYouTubeId(input);
  return id ? { status: "valid", id } : { status: "invalid" };
}

export type VideoChange =
  | { action: "keep" } // campo não enviado: não altera o vídeo salvo
  | { action: "clear" } // campo enviado vazio: remove o vídeo
  | { action: "set"; id: string } // link válido: grava/atualiza o ID
  | { action: "invalid" }; // link inválido: a Server Action rejeita

/** Interpreta o campo video_url recebido pelo servidor. undefined = "não mexer". */
export function resolveVideoChange(videoUrl: string | null | undefined): VideoChange {
  if (videoUrl === undefined || videoUrl === null) return { action: "keep" };
  const state = parseYouTubeInput(videoUrl);
  if (state.status === "empty") return { action: "clear" };
  if (state.status === "valid") return { action: "set", id: state.id };
  return { action: "invalid" };
}

export type VideoColumns = { youtube_video_id?: string | null };

/** Colunas a incluir no INSERT: só quando há um vídeo válido. */
export function videoColumnsForInsert(change: VideoChange): VideoColumns {
  return change.action === "set" ? { youtube_video_id: change.id } : {};
}

/**
 * Colunas a incluir no UPDATE:
 *  - keep    -> nada (o vídeo salvo permanece como está);
 *  - clear   -> youtube_video_id = null (remove o vídeo);
 *  - set     -> youtube_video_id = ID novo;
 *  - invalid -> nada (a Server Action já rejeitou antes).
 */
export function videoColumnsForUpdate(change: VideoChange): VideoColumns {
  switch (change.action) {
    case "set":
      return { youtube_video_id: change.id };
    case "clear":
      return { youtube_video_id: null };
    default:
      return {};
  }
}

/**
 * Valor de video_url que o formulário deve enviar ao servidor:
 *  - igual ao valor inicial -> undefined (campo intacto: não mexe no vídeo salvo);
 *  - diferente -> o texto atual ("" = remover o vídeo).
 */
export function videoUrlForSubmit(
  current: string | null | undefined,
  initial: string | null | undefined
): string | undefined {
  const now = (current ?? "").trim();
  const before = (initial ?? "").trim();
  return now === before ? undefined : now;
}

/* -------------------------------------------------------------------------- */
/* URLs montadas a partir do ID (nunca a partir de texto do usuário)           */
/* -------------------------------------------------------------------------- */

export const YOUTUBE_EMBED_ORIGIN = "https://www.youtube-nocookie.com";

/** URL do player (modo de privacidade aprimorada). null se o ID não for válido. */
export function youTubeEmbedUrl(id: unknown): string | null {
  return isValidYouTubeId(id)
    ? `${YOUTUBE_EMBED_ORIGIN}/embed/${id}?rel=0&playsinline=1&hl=pt-BR`
    : null;
}

/** Link normal do vídeo no YouTube. null se o ID não for válido. */
export function youTubeWatchUrl(id: unknown): string | null {
  return isValidYouTubeId(id) ? `https://www.youtube.com/watch?v=${id}` : null;
}

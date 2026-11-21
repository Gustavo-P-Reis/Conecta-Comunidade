import { ExternalLink } from "lucide-react";
import { youTubeEmbedUrl, youTubeWatchUrl } from "@/lib/youtube";

/**
 * Player do vídeo de apresentação do evento.
 *
 * Segurança: o iframe só é montado com um ID já validado (11 caracteres) sobre um host
 * fixo (youtube-nocookie.com). Nenhum HTML, iframe ou URL do usuário é usado, e não há
 * dangerouslySetInnerHTML. Sem vídeo (ou com ID inválido) não renderiza nada, então a
 * página não ganha espaço vazio.
 *
 * referrerPolicy: o YouTube exige o cabeçalho Referer na incorporação; "no-referrer"
 * causa o erro 153. Por isso strict-origin-when-cross-origin.
 */
export function YouTubeEmbed({
  videoId,
  title,
}: {
  videoId: string | null | undefined;
  title: string;
}) {
  const embedUrl = youTubeEmbedUrl(videoId);
  const watchUrl = youTubeWatchUrl(videoId);
  if (!embedUrl || !watchUrl) return null;

  return (
    <section aria-labelledby="video-apresentacao" className="flex flex-col gap-3">
      <h2 id="video-apresentacao" className="font-display text-xl font-medium">
        Vídeo de apresentação
      </h2>

      <div className="relative aspect-video overflow-hidden rounded-lg border border-border bg-card shadow-[var(--shadow-card)]">
        <iframe
          src={embedUrl}
          title={`Vídeo de apresentação: ${title}`}
          loading="lazy"
          allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      </div>

      <p className="text-xs text-muted-foreground">
        O vídeo não carregou?{" "}
        <a
          href={watchUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-primary hover:underline"
        >
          Assistir no YouTube <ExternalLink className="size-3" />
        </a>
      </p>
    </section>
  );
}

"use client";

import * as React from "react";
import Image from "next/image";
import { ImagePlus, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

const MAX_SIZE_MB = 5;
const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp"];

export function ImageUpload({
  value,
  onChange,
}: {
  value?: string;
  onChange: (url: string | null) => void;
}) {
  const supabase = createClient();
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [preview, setPreview] = React.useState<string | null>(value ?? null);
  const [uploading, setUploading] = React.useState(false);
  const [dragOver, setDragOver] = React.useState(false);

  async function handleFile(file: File) {
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error("Envie uma imagem em JPG, PNG ou WEBP.");
      return;
    }
    if (file.size > MAX_SIZE_MB * 1024 * 1024) {
      toast.error(`A imagem precisa ter até ${MAX_SIZE_MB}MB.`);
      return;
    }

    setUploading(true);
    setPreview(URL.createObjectURL(file));

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Sua sessão expirou. Entre novamente para enviar imagens.");
      setUploading(false);
      return;
    }

    const ext = file.name.split(".").pop();
    const path = `${user.id}/${crypto.randomUUID()}.${ext}`;

    const { error } = await supabase.storage
      .from("event-images")
      .upload(path, file, { upsert: false });

    if (error) {
      toast.error("Não foi possível enviar a imagem. Tente novamente.");
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from("event-images").getPublicUrl(path);
    onChange(data.publicUrl);
    setUploading(false);
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES.join(",")}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFile(file);
        }}
      />

      {preview ? (
        <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border">
          <Image src={preview} alt="Pré-visualização do evento" fill className="object-cover" />
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60">
              <Loader2 className="size-6 animate-spin text-primary" />
            </div>
          )}
          <div className="absolute right-3 top-3 flex gap-2">
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="rounded-full bg-background/80 backdrop-blur-sm border border-border-strong px-3 py-1.5 text-xs font-medium hover:bg-card transition-colors cursor-pointer"
            >
              Substituir
            </button>
            <button
              type="button"
              onClick={handleRemove}
              aria-label="Remover imagem"
              className="flex size-8 items-center justify-center rounded-full bg-background/80 backdrop-blur-sm border border-border-strong hover:bg-destructive-soft hover:text-destructive transition-colors cursor-pointer"
            >
              <X className="size-4" />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files?.[0];
            if (file) handleFile(file);
          }}
          className={cn(
            "flex aspect-video w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed transition-colors cursor-pointer",
            dragOver
              ? "border-primary bg-primary/5"
              : "border-border-strong bg-card hover:bg-secondary"
          )}
        >
          <ImagePlus className="size-6 text-muted-foreground" />
          <p className="text-sm font-medium text-foreground">
            Clique para selecionar ou arraste uma imagem
          </p>
          <p className="text-xs text-muted-foreground">JPG, PNG ou WEBP · até {MAX_SIZE_MB}MB</p>
        </button>
      )}
    </div>
  );
}

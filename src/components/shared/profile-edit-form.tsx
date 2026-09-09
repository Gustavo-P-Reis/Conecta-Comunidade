"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { profileSchema, type ProfileSchema } from "@/lib/validations";
import { updateProfile } from "@/lib/actions/profile";
import type { Profile } from "@/lib/types";

export function ProfileEditForm({ profile }: { profile: Profile }) {
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileSchema>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: profile.name,
      avatar_url: profile.avatar_url ?? "",
    },
  });

  async function onSubmit(values: ProfileSchema) {
    setSubmitting(true);
    const result = await updateProfile(values);
    setSubmitting(false);

    if (result.success) {
      toast.success("Perfil atualizado!");
    } else {
      toast.error(result.message ?? "Não foi possível salvar.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
      <div className="flex flex-col gap-2">
        <Label htmlFor="name">Nome</Label>
        <Input id="name" {...register("name")} />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="avatar_url">Link da foto de perfil (opcional)</Label>
        <Input id="avatar_url" placeholder="https://..." {...register("avatar_url")} />
        {errors.avatar_url && (
          <p className="text-xs text-destructive">{errors.avatar_url.message}</p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <Label>E-mail</Label>
        <Input value={profile.email} disabled />
        <p className="text-xs text-muted-foreground">O e-mail não pode ser alterado por aqui.</p>
      </div>

      <Button type="submit" disabled={submitting} className="self-start mt-2">
        {submitting && <Loader2 className="size-4 animate-spin" />}
        Salvar alterações
      </Button>
    </form>
  );
}

"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Info, CalendarDays, MapPin, Ticket, User, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ImageUpload } from "@/components/events/image-upload";
import { eventSchema, type EventSchema } from "@/lib/validations";
import { CATEGORIES } from "@/lib/constants";
import { CITY_OPTIONS, REGION_OPTIONS, cityUsesRegions } from "@/lib/geography";
import { createEvent, updateEvent } from "@/lib/actions/events";
import type { EventFormValues } from "@/lib/types";

export function EventForm({
  mode,
  eventId,
  defaultValues,
}: {
  mode: "create" | "edit";
  eventId?: string;
  defaultValues?: Partial<EventFormValues>;
}) {
  const router = useRouter();
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    clearErrors,
    formState: { errors },
  } = useForm<EventSchema>({
    resolver: zodResolver(eventSchema),
    defaultValues: {
      title: defaultValues?.title ?? "",
      description: defaultValues?.description ?? "",
      category: defaultValues?.category ?? "cultura",
      event_date: defaultValues?.event_date ?? "",
      event_time: defaultValues?.event_time ?? "",
      city: defaultValues?.city,
      region: defaultValues?.region,
      location: defaultValues?.location ?? "",
      neighborhood: defaultValues?.neighborhood ?? "",
      address: defaultValues?.address ?? "",
      is_free: defaultValues?.is_free ?? true,
      price: defaultValues?.price,
      capacity: defaultValues?.capacity,
      organizer_name: defaultValues?.organizer_name ?? "",
      contact: defaultValues?.contact ?? "",
      image_url: defaultValues?.image_url ?? "",
    },
  });

  const isFree = watch("is_free");
  const city = watch("city");
  const regionEnabled = cityUsesRegions(city);

  async function onSubmit(values: EventSchema) {
    setSubmitting(true);

    const result =
      mode === "create"
        ? await createEvent(values as EventFormValues)
        : await updateEvent(eventId!, values as EventFormValues);

    setSubmitting(false);

    if (result.success) {
      toast.success(
        mode === "create" ? "Evento publicado com sucesso!" : "Alterações salvas!"
      );
      router.push(`/eventos/${result.eventId}`);
      router.refresh();
    } else {
      toast.error(result.message ?? "Algo deu errado. Tente novamente.");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Info className="size-4" />
            <CardTitle className="text-base">Informações básicas</CardTitle>
          </div>
          <CardDescription>O essencial para as pessoas entenderem do que se trata.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <Label htmlFor="title">Título do evento</Label>
            <Input id="title" placeholder="Ex: Feira Comunitária de Artesanato" {...register("title")} />
            {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea
              id="description"
              placeholder="Conte o que vai acontecer, para quem é e o que torna esse evento especial."
              className="min-h-32"
              {...register("description")}
            />
            {errors.description && (
              <p className="text-xs text-destructive">{errors.description.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="category">Categoria</Label>
            <Controller
              control={control}
              name="category"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Escolha uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.category && (
              <p className="text-xs text-destructive">{errors.category.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <CalendarDays className="size-4" />
            <CardTitle className="text-base">Data e horário</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="event_date">Data</Label>
            <Input id="event_date" type="date" {...register("event_date")} />
            {errors.event_date && (
              <p className="text-xs text-destructive">{errors.event_date.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="event_time">Horário</Label>
            <Input id="event_time" type="time" {...register("event_time")} />
            {errors.event_time && (
              <p className="text-xs text-destructive">{errors.event_time.message}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <MapPin className="size-4" />
            <CardTitle className="text-base">Localização</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city">Cidade</Label>
              <Controller
                control={control}
                name="city"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value);
                      // Fora de uma cidade com regiões, a região não se aplica: limpa o valor anterior.
                      if (!cityUsesRegions(value)) {
                        setValue("region", undefined);
                        clearErrors("region");
                      }
                    }}
                  >
                    <SelectTrigger id="city">
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {CITY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.city && <p className="text-xs text-destructive">{errors.city.message}</p>}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="region">Região</Label>
              <Controller
                control={control}
                name="region"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    disabled={!regionEnabled}
                  >
                    <SelectTrigger id="region">
                      <SelectValue
                        placeholder={
                          !city
                            ? "Escolha a cidade primeiro"
                            : regionEnabled
                              ? "Selecione a região"
                              : "Não se aplica"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.region && (
                <p className="text-xs text-destructive">{errors.region.message}</p>
              )}
              {city && !regionEnabled && (
                <p className="text-xs text-muted-foreground">
                  A região não se aplica a esta cidade.
                </p>
              )}
            </div>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <div className="flex flex-col gap-2">
              <Label htmlFor="location">Local</Label>
              <Input id="location" placeholder="Ex: Praça Central" {...register("location")} />
              {errors.location && (
                <p className="text-xs text-destructive">{errors.location.message}</p>
              )}
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="neighborhood">Bairro</Label>
              <Input id="neighborhood" placeholder="Ex: Vila Esperança" {...register("neighborhood")} />
              {errors.neighborhood && (
                <p className="text-xs text-destructive">{errors.neighborhood.message}</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="address">Endereço completo (opcional)</Label>
            <Input id="address" placeholder="Rua, número" {...register("address")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <Ticket className="size-4" />
            <CardTitle className="text-base">Entrada</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-5">
          <div className="flex items-center justify-between rounded-lg border border-border bg-background/40 px-4 py-3">
            <div>
              <p className="text-sm font-medium">Evento gratuito</p>
              <p className="text-xs text-muted-foreground">
                Desative para informar o valor do ingresso.
              </p>
            </div>
            <Controller
              control={control}
              name="is_free"
              render={({ field }) => (
                <Switch checked={field.value} onCheckedChange={field.onChange} />
              )}
            />
          </div>

          {!isFree && (
            <div className="flex flex-col gap-2 sm:w-64">
              <Label htmlFor="price">Valor (R$)</Label>
              <Input
                id="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0,00"
                {...register("price")}
              />
              {errors.price && <p className="text-xs text-destructive">{errors.price.message}</p>}
            </div>
          )}

          <div className="flex flex-col gap-2 sm:w-64">
            <Label htmlFor="capacity">Capacidade (opcional)</Label>
            <Input id="capacity" type="number" min="1" placeholder="Sem limite" {...register("capacity")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <User className="size-4" />
            <CardTitle className="text-base">Organizador</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-5 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <Label htmlFor="organizer_name">Nome</Label>
            <Input id="organizer_name" placeholder="Quem está organizando" {...register("organizer_name")} />
            {errors.organizer_name && (
              <p className="text-xs text-destructive">{errors.organizer_name.message}</p>
            )}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="contact">Contato (opcional)</Label>
            <Input id="contact" placeholder="Telefone, e-mail ou @" {...register("contact")} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2 text-primary">
            <ImageIcon className="size-4" />
            <CardTitle className="text-base">Imagem</CardTitle>
          </div>
          <CardDescription>Uma boa foto ajuda o evento a se destacar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Controller
            control={control}
            name="image_url"
            render={({ field }) => (
              <ImageUpload value={field.value || undefined} onChange={(url) => field.onChange(url ?? "")} />
            )}
          />
        </CardContent>
      </Card>

      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancelar
        </Button>
        <Button type="submit" disabled={submitting}>
          {submitting && <Loader2 className="size-4 animate-spin" />}
          {mode === "create" ? "Publicar evento" : "Salvar alterações"}
        </Button>
      </div>
    </form>
  );
}

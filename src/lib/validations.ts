import { z } from "zod";
import { CITY_VALUES, REGION_VALUES, cityUsesRegions } from "@/lib/geography";
import { YOUTUBE_URL_MAX_LENGTH, parseYouTubeInput } from "@/lib/youtube";

const categoryValues = [
  "cultura",
  "esportes",
  "educacao",
  "musica",
  "acoes_sociais",
  "meio_ambiente",
  "lazer",
  "outros",
] as const;

export const eventSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(3, "O título precisa ter pelo menos 3 caracteres.")
      .max(120, "O título pode ter no máximo 120 caracteres."),
    description: z
      .string()
      .trim()
      .min(10, "Conte um pouco mais sobre o evento (mínimo 10 caracteres).")
      .max(4000, "A descrição pode ter no máximo 4000 caracteres."),
    category: z.enum(categoryValues, {
      errorMap: () => ({ message: "Escolha uma categoria." }),
    }),
    event_date: z
      .string()
      .min(1, "Escolha uma data.")
      .refine((value) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return new Date(`${value}T00:00:00`) >= today;
      }, "A data precisa ser hoje ou no futuro."),
    event_time: z.string().min(1, "Escolha um horário."),
    city: z.enum(CITY_VALUES, {
      errorMap: () => ({ message: "Selecione a cidade." }),
    }),
    region: z
      .enum(REGION_VALUES, {
        errorMap: () => ({ message: "Selecione a região." }),
      })
      .optional(),
    location: z
      .string()
      .trim()
      .min(2, "Informe o local do evento.")
      .max(160, "Local muito longo."),
    neighborhood: z
      .string()
      .trim()
      .min(2, "Informe o bairro.")
      .max(120, "Bairro muito longo."),
    address: z.string().trim().max(200).optional().or(z.literal("")),
    is_free: z.boolean(),
    price: z.coerce.number().positive("Informe um valor válido.").optional(),
    capacity: z.coerce
      .number()
      .int()
      .positive("Informe um número válido.")
      .optional(),
    organizer_name: z
      .string()
      .trim()
      .min(2, "Informe o nome do organizador.")
      .max(120),
    contact: z.string().trim().max(160).optional().or(z.literal("")),
    image_url: z.string().url().optional().or(z.literal("")),
    // Vídeo de apresentação (opcional): link do YouTube. Vazio = sem vídeo. O servidor
    // extrai o ID de novo (src/lib/actions/events.ts); aqui só se recusa link inválido.
    video_url: z
      .string()
      .trim()
      .max(YOUTUBE_URL_MAX_LENGTH, "O link do vídeo é muito longo.")
      .refine((value) => parseYouTubeInput(value).status !== "invalid", {
        message: "Cole um link válido do YouTube (ex.: https://youtu.be/...).",
      })
      .optional(),
  })
  .refine((data) => data.is_free || (data.price && data.price > 0), {
    message: "Informe o valor do ingresso para eventos pagos.",
    path: ["price"],
  })
  // A região é obrigatória quando a cidade usa regiões (hoje, São Paulo). Em
  // "Outra cidade" ela não se aplica: a Server Action grava region = null.
  .superRefine((data, ctx) => {
    if (cityUsesRegions(data.city) && !data.region) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["region"],
        message: "Selecione a região.",
      });
    }
  });

export type EventSchema = z.infer<typeof eventSchema>;

export const signUpSchema = z
  .object({
    name: z.string().trim().min(2, "Informe seu nome completo."),
    email: z.string().trim().email("E-mail inválido."),
    password: z.string().min(6, "A senha precisa ter pelo menos 6 caracteres."),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem.",
    path: ["confirmPassword"],
  });

export type SignUpSchema = z.infer<typeof signUpSchema>;

export const loginSchema = z.object({
  email: z.string().trim().email("E-mail inválido."),
  password: z.string().min(1, "Informe sua senha."),
});

export type LoginSchema = z.infer<typeof loginSchema>;

export const reportSchema = z.object({
  reason: z.enum([
    "informacao_falsa",
    "spam",
    "conteudo_inadequado",
    "evento_inexistente",
    "outro",
  ]),
  description: z.string().trim().max(500).optional().or(z.literal("")),
});

export type ReportSchema = z.infer<typeof reportSchema>;

export const profileSchema = z.object({
  name: z.string().trim().min(2, "Informe seu nome.").max(120),
  avatar_url: z.string().url().optional().or(z.literal("")),
});

export type ProfileSchema = z.infer<typeof profileSchema>;

import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Formata um valor em reais. Ex: 25 -> "R$ 25,00" */
export function formatPrice(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

/** Formata uma data ISO (YYYY-MM-DD) para "12 de out" ou "12 de out de 2027" */
export function formatEventDate(isoDate: string, withYear = false) {
  const date = new Date(`${isoDate}T00:00:00`);
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "short",
    year: withYear ? "numeric" : undefined,
  }).format(date);
}

/** Formata um horário "HH:MM:SS" para "HH:MM" */
export function formatEventTime(time: string) {
  return time.slice(0, 5);
}

/** Retorna algo como "Sáb, 12 de out" para uso em cards e páginas de evento */
export function formatEventDateLong(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  const formatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  }).format(date);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
}

export function isEventUpcoming(isoDate: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return new Date(`${isoDate}T00:00:00`) >= today;
}

/** Gera iniciais a partir de um nome, para usar em avatares sem foto */
export function getInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
}

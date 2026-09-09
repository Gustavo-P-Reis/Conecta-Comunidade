"use client";

import * as React from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CATEGORIES, SORT_OPTIONS } from "@/lib/constants";

export function EventFilters() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const [query, setQuery] = React.useState(searchParams.get("q") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "todos") {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    params.delete("page");
    router.push(`${pathname}?${params.toString()}`);
  }

  // Debounce da busca por texto
  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (query !== (searchParams.get("q") ?? "")) {
        updateParam("q", query || null);
      }
    }, 400);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const activeCategory = searchParams.get("category") ?? "todos";
  const activePrice = searchParams.get("price") ?? "todos";
  const activeSort = searchParams.get("sort") ?? "recentes";
  const activeDate = searchParams.get("date") ?? "";

  const hasActiveFilters =
    activeCategory !== "todos" || activePrice !== "todos" || !!activeDate;

  function clearFilters() {
    setQuery("");
    router.push(pathname);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Procure eventos, lugares ou categorias..."
          className="h-13 pl-11 text-base"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
          <SlidersHorizontal className="size-4" />
          Filtros
        </div>

        <Select value={activeCategory} onValueChange={(v) => updateParam("category", v)}>
          <SelectTrigger className="w-auto min-w-[9.5rem]">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todas as categorias</SelectItem>
            {CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={activePrice} onValueChange={(v) => updateParam("price", v)}>
          <SelectTrigger className="w-auto min-w-[8rem]">
            <SelectValue placeholder="Entrada" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Gratuito e pago</SelectItem>
            <SelectItem value="gratuito">Gratuito</SelectItem>
            <SelectItem value="pago">Pago</SelectItem>
          </SelectContent>
        </Select>

        <Input
          type="date"
          value={activeDate}
          onChange={(e) => updateParam("date", e.target.value || null)}
          className="w-auto"
        />

        {hasActiveFilters && (
          <Button variant="ghost" size="sm" onClick={clearFilters}>
            <X className="size-3.5" /> Limpar
          </Button>
        )}

        <div className="ml-auto">
          <Select value={activeSort} onValueChange={(v) => updateParam("sort", v)}>
            <SelectTrigger className="w-auto min-w-[10rem]">
              <SelectValue placeholder="Ordenar" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

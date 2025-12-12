// app/components/catalog-filters.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search } from "lucide-react";

interface CatalogFiltersProps {
  categories: Array<{ id: string; name: string }>;
  currentSearch?: string;
  currentCategory?: string;
}

export function CatalogFilters({
  categories,
  currentSearch,
  currentCategory,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Local controlled state initialised from server props to avoid hydration mismatch
  const [search, setSearch] = useState<string>(currentSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string>(currentCategory ?? "");

  // Keep local state in sync if server-provided props change (rare but safe)
  useEffect(() => {
    setSearch(currentSearch ?? "");
    setSelectedCategory(currentCategory ?? "");
  }, [currentSearch, currentCategory]);

  // Sync with URL changes (back/forward navigation) — read from searchParams
  useEffect(() => {
    try {
      const sp = searchParams?.get?.("search") ?? "";
      const cat = searchParams?.get?.("category") ?? "";
      if (sp !== search) setSearch(sp);
      if (cat !== selectedCategory) setSelectedCategory(cat);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      // ignore (defensive)
    }
    // depend on the string representation so effect runs when query changes
  }, [searchParams?.toString?.()]);

  const pushWithParams = (params: URLSearchParams) => {
    const qs = params.toString();
    const path = qs ? `/catalog?${qs}` : "/catalog";
    router.push(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    // create params object from current searchParams to keep other params intact
    const params = new URLSearchParams(searchParams?.toString?.() ?? "");

    if (search) params.set("search", search);
    else params.delete("search");

    if (selectedCategory) params.set("category", selectedCategory);
    else params.delete("category");

    pushWithParams(params);
  };

  const handleCategoryChange = (value: string) => {
    // `value` will be "" for "Todas las categorías"
    setSelectedCategory(value);

    const params = new URLSearchParams(searchParams?.toString?.() ?? "");
    if (value) params.set("category", value);
    else params.delete("category");

    if (search) params.set("search", search);

    pushWithParams(params);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("");
    router.push("/catalog");
  };

  return (
    <form onSubmit={handleSearch} className="space-y-4" aria-label="Filtros de catálogo">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <div className="flex-1 min-w-0">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Buscar productos</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10 bg-input border-border focus:border-primary transition-colors"
              aria-label="Buscar productos"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
              aria-label="Buscar"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <label className="text-xs sm:text-sm font-medium mb-2 block">Categoría</label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger className="bg-input border-border focus:border-primary transition-colors">
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              {/* Use empty string "" to represent "all" — keeps URL clean (no 'all' literal) */}
              <SelectItem value="">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || selectedCategory) && (
          <Button
            type="button"
            variant="outline"
            onClick={handleClearFilters}
            className="border-primary/30 hover:bg-primary/10 w-full sm:w-auto bg-transparent"
          >
            Limpiar Filtros
          </Button>
        )}
      </div>
    </form>
  );
}

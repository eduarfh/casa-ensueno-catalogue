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

  // Use "all" as the UI sentinel value for no-category selected
  const initialCategoryUi = currentCategory ? currentCategory : "all";

  const [search, setSearch] = useState<string>(currentSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryUi);

  useEffect(() => {
    setSearch(currentSearch ?? "");
    setSelectedCategory(currentCategory ?? "all");
  }, [currentSearch, currentCategory]);

  // Keep in sync with back/forward (read from searchParams)
  useEffect(() => {
    try {
      const sp = searchParams?.get?.("search") ?? "";
      const cat = searchParams?.get?.("category") ?? "";
      const catUi = cat || "all";
      if (sp !== search) setSearch(sp);
      if (catUi !== selectedCategory) setSelectedCategory(catUi);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      // defensive: ignore
    }
    // we depend on string form so we update when query changes
  }, [searchParams?.toString?.()]);

  const pushWithParams = (params: URLSearchParams) => {
    const qs = params.toString();
    const path = qs ? `/catalog?${qs}` : "/catalog";
    router.push(path);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams?.toString?.() ?? "");

    if (search) params.set("search", search);
    else params.delete("search");

    // if UI is "all", remove category param; otherwise set it
    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    else params.delete("category");

    pushWithParams(params);
  };

  const handleCategoryChange = (value: string) => {
    // value will be "all" or a category id
    setSelectedCategory(value);

    const params = new URLSearchParams(searchParams?.toString?.() ?? "");
    if (value && value !== "all") params.set("category", value);
    else params.delete("category");

    if (search) params.set("search", search);

    pushWithParams(params);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
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
              {/* Use "all" sentinel — not empty string to satisfy Select component */}
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || (selectedCategory && selectedCategory !== "all")) && (
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

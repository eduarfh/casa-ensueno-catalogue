// app/components/catalog-filters.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search } from "lucide-react";
import CategoryFilter from "@/components/category-filter"; // <-- asegúrate de la ruta si la tienes en otro sitio

interface CatalogFiltersProps {
  categories: Array<{ id: string; name: string }>;
  currentSearch?: string;
  currentCategory?: string; // puede ser id o nombre
  products: Array<any>; // productos simplificados con .category (nombre) — los pasamos desde page.tsx
}

export function CatalogFilters({
  categories,
  currentSearch,
  currentCategory,
  products,
}: CatalogFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Resolve initial category id: currentCategory puede ser id o name.
  const resolveCategoryId = (input?: string | null) => {
    if (!input) return "all";
    // si coincide con id -> devolvemos id
    const byId = categories.find((c) => c.id === input);
    if (byId) return byId.id;
    // si coincide con name -> devolvemos id
    const byName = categories.find((c) => c.name === input);
    if (byName) return byName.id;
    // else fallback
    return "all";
  };

  const initialCategoryUi = resolveCategoryId(currentCategory ?? null);

  const [search, setSearch] = useState<string>(currentSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string>(initialCategoryUi); // guarda id o "all"

  useEffect(() => {
    setSearch(currentSearch ?? "");
    setSelectedCategory(resolveCategoryId(currentCategory ?? null));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch, currentCategory]);

  // Keep in sync with back/forward (read from searchParams)
  useEffect(() => {
    try {
      const sp = searchParams?.get?.("search") ?? "";
      const cat = searchParams?.get?.("category") ?? "";
      const catUi = resolveCategoryId(cat || "");
      if (sp !== search) setSearch(sp);
      if (catUi !== selectedCategory) setSelectedCategory(catUi);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    } catch {
      // defensive: ignore
    }
    // dependemos de la forma string para actualizar cuando cambie la query
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

    if (selectedCategory && selectedCategory !== "all") params.set("category", selectedCategory);
    else params.delete("category");

    pushWithParams(params);
  };

  // Cuando CategoryFilter nos da un nombre de categoría (o null), lo traducimos a id y navegamos
  const handleCategoryFilterSelect = (categoryName: string | null) => {
    // categoryName === null significa "Todas"
    const id = categoryName ? categories.find((c) => c.name === categoryName)?.id ?? "all" : "all";
    setSelectedCategory(id);

    const params = new URLSearchParams(searchParams?.toString?.() ?? "");
    if (id && id !== "all") params.set("category", id);
    else params.delete("category");

    if (search) params.set("search", search);
    pushWithParams(params);
  };

  const handleClearFilters = () => {
    setSearch("");
    setSelectedCategory("all");
    router.push("/catalog");
  };

  // pasar a CategoryFilter el valor seleccionado por nombre (o null)
  const selectedCategoryName = selectedCategory === "all" ? null : categories.find((c) => c.id === selectedCategory)?.name ?? null;

  // Preparar productos para CategoryFilter — espera `product.category` como string
  const productsForFilter = useMemo(() => products ?? [], [products]);

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

          {/* Usamos CategoryFilter (chips) en lugar del Select */}
          <CategoryFilter
            products={productsForFilter}
            selectedCategory={selectedCategoryName}
            onSelectCategory={handleCategoryFilterSelect}
          />
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

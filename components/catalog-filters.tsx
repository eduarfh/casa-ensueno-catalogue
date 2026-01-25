// components/catalog-filters.tsx
"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CategoryFilter from "@/components/category-filter";
import { Product } from "@/lib/product";
import AvailabilityFilter from "./availability-filter";

interface CatalogFiltersProps {
  categories: { id: string; name: string }[];
  currentSearch?: string | null;
  currentCategory?: string | null;
  products?: Product[];
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  currentSearch,
  currentCategory,
  products = [],
}) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialAvailableParam = searchParams?.get("available") ?? null;
  const mapParam = (p: string | null) => {
    if (!p) return "available";
    if (p === "1" || p.toLowerCase() === "true") return "available";
    return "all";
  };

  const [searchTerm, setSearchTerm] = useState<string>(currentSearch ?? "");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(currentCategory ?? null);
  const [availableFilter, setAvailableFilter] = useState<"all" | "available">(mapParam(initialAvailableParam));

  useEffect(() => {
    setSearchTerm(currentSearch ?? "");
    setSelectedCategory(currentCategory ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch, currentCategory]);

  const applyFilters = (categoryId: string | null, search: string | null, available: "all" | "available") => {
    setSelectedCategory(categoryId);
    setSearchTerm(search ?? "");

    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (categoryId && categoryId.trim() !== "") params.set("category", categoryId);
    if (available === "available") params.set("available", "1");

    const q = params.toString();
    router.push(`${pathname}${q ? `?${q}` : ""}`);
  };

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault();
    applyFilters(selectedCategory, searchTerm, availableFilter);
  };

  const onClear = () => {
    setSearchTerm("");
    setAvailableFilter("available");
    applyFilters(null, "", "available");
  };

  const applyCategory = (catId: string | null) => {
    applyFilters(catId, searchTerm, availableFilter);
  };

  return (
    <div className="mb-4">
      <form onSubmit={onSubmit} className="flex gap-2 items-center mb-3">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 outline-none focus:ring focus:ring-opacity-60"
          aria-label="Buscar productos"
        />
        <div className="ml-2">
          {/* PASAMOS active + onChange para cumplir la firma del componente */}
          <AvailabilityFilter
            active={availableFilter === "available"}
            onChange={(active) => setAvailableFilter(active ? "available" : "all")}
          />
        </div>
      </form>

      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={applyCategory}
        products={products}
      />
    </div>
  );
};

export default CatalogFilters;

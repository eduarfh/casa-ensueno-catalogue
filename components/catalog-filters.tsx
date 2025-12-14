// components/catalog-filters.tsx
"use client"

import React, { useEffect, useState } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { Product } from "@/lib/products"
import CategoryFilter from "@/components/category-filter"

interface CatalogFiltersProps {
  categories: { id: string; name: string }[]
  currentSearch?: string | null
  currentCategory?: string | null
  products?: Product[] // opcional, se usa solo como fallback si no hay categories
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({
  categories,
  currentSearch,
  currentCategory,
  products = [],
}) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [searchTerm, setSearchTerm] = useState<string>(currentSearch ?? "")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(currentCategory ?? null)

  useEffect(() => {
    // sincroniza cuando cambian los query params desde el servidor / url externa
    setSearchTerm(currentSearch ?? "")
    setSelectedCategory(currentCategory ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSearch, currentCategory])

  const applyFilters = (categoryId: string | null, search: string | null) => {
    setSelectedCategory(categoryId)
    setSearchTerm(search ?? "")

    const params = new URLSearchParams()
    if (search && search.trim() !== "") params.set("search", search.trim())
    if (categoryId && categoryId.trim() !== "") params.set("category", categoryId)

    const q = params.toString()
    router.push(`${pathname}${q ? `?${q}` : ""}`)
  }

  const onSubmit: React.FormEventHandler = (e) => {
    e.preventDefault()
    applyFilters(selectedCategory, searchTerm)
  }

  const onClear = () => {
    setSearchTerm("")
    applyFilters(null, "")
  }

  // applyCategory será llamado por CategoryFilter con el id de la categoría (o null)
  const applyCategory = (catId: string | null) => {
    applyFilters(catId, searchTerm)
  }

  return (
    <div className="mb-4">
      {/* Barra de búsqueda */}
      <form onSubmit={onSubmit} className="flex gap-2 items-center mb-3">
        <input
          type="search"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 outline-none focus:ring focus:ring-opacity-60"
          aria-label="Buscar productos"
        />
        <button
          type="submit"
          className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
        >
          Buscar
        </button>
        <button
          type="button"
          onClick={onClear}
          className="px-3 py-2 rounded-md border hover:bg-muted/20"
        >
          Limpiar
        </button>
      </form>

      {/* Filtros por categoría (debajo de la barra de búsqueda) */}
      <CategoryFilter
        categories={categories}
        selectedCategory={selectedCategory}
        onSelectCategory={applyCategory}
        products={products}
      />
    </div>
  )
}

export default CatalogFilters

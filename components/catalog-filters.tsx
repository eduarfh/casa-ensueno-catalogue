// components/ui/catalog-filters.tsx

"use client"

import type React from "react"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Search } from "lucide-react"

interface CatalogFiltersProps {
  categories: Array<{ id: string; name: string }>
  currentSearch?: string
  currentCategory?: string
}

export function CatalogFilters({ categories, currentSearch, currentCategory }: CatalogFiltersProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch || "")
  const [selectedCategory, setSelectedCategory] = useState(currentCategory || "")

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams(searchParams)

    if (search) {
      params.set("search", search)
    } else {
      params.delete("search")
    }

    if (selectedCategory) {
      params.set("category", selectedCategory)
    } else {
      params.delete("category")
    }

    router.push(`/catalog?${params.toString()}`)
  }

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value)
    const params = new URLSearchParams(searchParams)

    if (value) {
      params.set("category", value)
    } else {
      params.delete("category")
    }

    if (search) {
      params.set("search", search)
    }

    router.push(`/catalog?${params.toString()}`)
  }

  const handleClearFilters = () => {
    setSearch("")
    setSelectedCategory("")
    router.push("/catalog")
  }

  return (
    <form onSubmit={handleSearch} className="space-y-4">
      <div className="flex flex-col gap-4 md:flex-row md:items-end">
        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Buscar productos</label>
          <div className="relative">
            <Input
              type="text"
              placeholder="Buscar por nombre..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pr-10"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <Search className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1">
          <label className="text-sm font-medium mb-2 block">Categoría</label>
          <Select value={selectedCategory} onValueChange={handleCategoryChange}>
            <SelectTrigger>
              <SelectValue placeholder="Todas las categorías" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas las categorías</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {(search || selectedCategory) && (
          <Button type="button" variant="outline" onClick={handleClearFilters}>
            Limpiar Filtros
          </Button>
        )}
      </div>
    </form>
  )
}

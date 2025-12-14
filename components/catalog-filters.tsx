// components/catalog-filters.tsx
"use client"

import React, { useState, useEffect } from "react"
import { useRouter, usePathname, useSearchParams } from "next/navigation"
import type { Product } from "@/lib/products"
import CategoryFilter from "@/components/category-filter"

interface CatalogFiltersProps {
  categories: { id: string; name: string }[]
  currentSearch?: string | null
  currentCategory?: string | null
  products: Product[]
}

const CatalogFilters: React.FC<CatalogFiltersProps> = ({ categories, currentSearch, currentCategory, products }) => {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const [selectedCategory, setSelectedCategory] = useState<string | null>(currentCategory ?? null)

  useEffect(() => {
    setSelectedCategory(currentCategory ?? null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentCategory])

  const applyCategory = (category: string | null) => {
    setSelectedCategory(category)
    const params = new URLSearchParams()

    const search = searchParams?.get("search") ?? ""
    if (search) params.set("search", search)

    if (category && category !== "") {
      params.set("category", category)
    }

    const q = params.toString()
    router.push(`${pathname}${q ? `?${q}` : ""}`)
  }

  return (
    <div>
      <CategoryFilter selectedCategory={selectedCategory} onSelectCategory={applyCategory} products={products} />
    </div>
  )
}

export default CatalogFilters

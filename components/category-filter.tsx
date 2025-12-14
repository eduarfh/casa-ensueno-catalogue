// components/category-filter.tsx
"use client"

import React, { useMemo } from "react"
import type { Product } from "@/lib/products"
import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/category-colors" // <-- import aquí

interface CategoryFilterProps {
  selectedCategory: string | null
  onSelectCategory: (category: string | null) => void
  products: Product[]
}

export function CategoryFilter({ selectedCategory, onSelectCategory, products }: CategoryFilterProps) {
  const categories = useMemo(() => {
    const unique = Array.from(new Set(products.map((p) => p.category || "Sin categoría")))
    return unique.sort()
  }, [products])

  const darkSelected = "dark:bg-[#95C7C3] dark:text-white"

  return (
    <div className="w-full overflow-x-auto pb-2 pt-1 md:px-1">
      <div className="flex gap-2 min-w-max px-4 md:px-0 md:flex-wrap md:justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onSelectCategory(null)}
          className={
            selectedCategory === null
              ? "bg-[#95C7C3] hover:bg-[#95C7C3]/90 text-white shadow-sm ring-1 ring-offset-1 ring-[#95C7C3]/40 dark:bg-[#95C7C3] dark:text-white rounded-lg px-4 py-2"
              : "bg-transparent outline outline-[color:var(--color-border)] dark:outline-[color:var(--color-border)] text-muted-foreground rounded-lg px-4 py-2"
          }
          aria-pressed={selectedCategory === null}
        >
          Todos
        </Button>

        {categories.map((category) => {
          const isSelected = selectedCategory === category
          const { background, textClass } = getCategoryColor(category)

          return (
            <Button
              key={category}
              variant="outline"
              onClick={() => onSelectCategory(category === "Sin categoría" ? "" : category)}
              className={`outline-2 rounded-lg px-4 py-2 duration-150 flex items-center justify-center whitespace-nowrap ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-[#95C7C3] shadow-lg ${textClass} ${darkSelected}`
                  : "opacity-95 md:hover:scale-[1.02] hover:opacity-90"
              }`}
              style={{ backgroundColor: background }}
              aria-pressed={isSelected}
            >
              {category}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryFilter

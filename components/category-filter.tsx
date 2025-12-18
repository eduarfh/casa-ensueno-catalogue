"use client"

import React, { useMemo, useState, useEffect } from "react"
import { Product } from "@/lib/product"
import { Button } from "@/components/ui/button"
import { getCategoryColor } from "@/lib/category-colors"

interface SimpleCategory {
  id: string
  name: string
}

interface CategoryFilterProps {
  categories?: SimpleCategory[]
  products?: Product[]
  selectedCategory: string | null
  onSelectCategory: (categoryId: string | null) => void
}

export function CategoryFilter({
  categories = [],
  products = [],
  selectedCategory,
  onSelectCategory,
}: CategoryFilterProps) {
  const list = useMemo(() => {
    if (categories && categories.length > 0) {
      return categories.map((c) => ({ id: c.id, name: c.name }))
    }

    const uniqueNames = Array.from(new Set(products.map((p) => p.category || "Sin categoría")))
    return uniqueNames.map((name) => ({ id: name, name }))
  }, [categories, products])

  // Map categoryId -> { background, textClass } (client-side)
  const [colors, setColors] = useState<Record<string, { background: string; textClass: string }>>({})

  useEffect(() => {
    const map: Record<string, { background: string; textClass: string }> = {}
    list.forEach((cat) => {
      const { background, textClass } = getCategoryColor(cat.name)
      map[cat.id] = { background, textClass }
    })
    setColors(map)
  }, [JSON.stringify(list)])

  const darkSelected = "dark:bg-[#95C7C3] dark:text-white"

  return (
    <div className="w-full overflow-x-auto pb-2 pt-1 md:px-1">
      <div className="flex gap-2 min-w-max px-4 md:px-0 md:flex-wrap md:justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "outline"}
          onClick={() => onSelectCategory(null)}
          // safe: uses CSS variables present in SSR & client
          style={{
            backgroundColor: "var(--color-primary)",
            color: "var(--color-primary-foreground)",
          }}
          className={
            selectedCategory === null
              ? "shadow-sm ring-1 ring-offset-1 rounded-lg px-4 py-2"
              : "bg-transparent outline outline-[color:var(--color-border)] dark:outline-[color:var(--color-border)] text-muted-foreground rounded-lg px-4 py-2"
          }
          aria-pressed={selectedCategory === null}
        >
          Todos
        </Button>

        {list.map((category) => {
          const isSelected = selectedCategory === category.id
          const colorObj = colors[category.id]
          const style = colorObj ? { backgroundColor: colorObj.background } : undefined
          const textClass = colorObj ? colorObj.textClass : "text-muted-foreground"

          return (
            <Button
              key={category.id}
              variant="outline"
              onClick={() => onSelectCategory(category.id)}
              // **aplicamos textClass siempre**, y añadimos el ring/shadow cuando está seleccionado
              className={`outline-2 rounded-lg px-4 py-2 duration-150 flex items-center justify-center whitespace-nowrap ${textClass} ${
                isSelected
                  ? `ring-2 ring-offset-2 ring-[color:var(--color-ring)] shadow-lg ${darkSelected}`
                  : "opacity-95 md:hover:scale-[1.02] hover:opacity-90"
              }`}
              style={style}
              aria-pressed={isSelected}
            >
              {category.name}
            </Button>
          )
        })}
      </div>
    </div>
  )
}

export default CategoryFilter

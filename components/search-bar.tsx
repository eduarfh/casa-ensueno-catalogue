// components/search-bar.tsx
"use client"

import React from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  id?: string
  className?: string
}

/**
 * Barra de búsqueda controlada.
 * - value / onChange: control desde el padre (p.ej. CatalogShell)
 * - placeholder / id / className: opcionales para personalizar
 */
export function SearchBar({ value, onChange, placeholder = "Buscar productos...", id = "catalog-search", className = "" }: SearchBarProps) {
  return (
    <div className={`relative w-full max-w-2xl mx-auto ${className}`}>
      <Search
        className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground"
        aria-hidden="true"
      />
      <Input
        id={id}
        type="search"
        role="searchbox"
        aria-label="Buscar productos"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange((e.target as HTMLInputElement).value)}
        className="pl-10 h-12 text-base outline-2 bg-card"
      />
    </div>
  )
}

export default SearchBar

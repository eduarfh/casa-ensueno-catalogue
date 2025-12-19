// components/availability-toggle.tsx
"use client"

import React from "react"
import { Eye, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

type AvailabilityValue = "all" | "available"

interface Props {
  value: AvailabilityValue
  onChange: (v: AvailabilityValue) => void
  className?: string
}

/**
 * Botón único que alterna entre:
 *  - "available" (Disponibles)  => envia ?available=1
 *  - "all"       (Todos)        => elimina el param available
 *
 * Diseño compacto, icono + texto (texto oculto en xs para ahorrar espacio).
 */
export default function AvailabilityToggle({ value, onChange, className = "" }: Props) {
  const toggle = () => {
    onChange(value === "available" ? "all" : "available")
  }

  const baseClass =
    "rounded-full px-3 py-1.5 flex items-center gap-2 text-sm font-medium shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-1"
  const isAvailable = value === "available"

  const stateClass = isAvailable
    ? "bg-[color:var(--color-primary)] text-[color:var(--color-primary-foreground)] outline-none"
    : "bg-transparent outline outline-[color:var(--color-border)] text-muted-foreground"

  const Icon = isAvailable ? CheckCircle : Eye
  const ariaLabel = isAvailable ? "Mostrando solo productos disponibles. Haz clic para ver todos." : "Mostrando todos los productos. Haz clic para ver solo disponibles."

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <p className="text-xs text-muted-foreground mb-1">
        Filtrar por productos disponibles
      </p>
      <Button
        variant="outline"
        onClick={toggle}
        className={`${baseClass} ${stateClass}`}
        aria-pressed={isAvailable}
        aria-label={ariaLabel}
        title={ariaLabel}
      >
        <Icon className="w-4 h-4" aria-hidden="true" />
        <span className="hidden sm:inline">{isAvailable ? "Disponibles" : "Todos"}</span>
      </Button>
    </div>
  )
}

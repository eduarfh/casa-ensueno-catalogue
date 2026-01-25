"use client"

import React from "react"
import { Button } from "@/components/ui/button"
import { Eye, EyeOff } from "lucide-react"

type Props = {
  active: boolean
  onChange: (active: boolean) => void
  className?: string
}

/**
 * AvailableFilter
 * - Diseño inspirado en el componente que pegaste.
 * - Etiqueta responsive (desktop / mobile).
 * - Botón cuadrado con icono Eye / EyeOff que alterna el filtro.
 * - Mantiene la estética del catálogo (usa Button).
 */
export default function AvailabilityFilter({ active, onChange, className = "" }: Props) {
  return (
    <div className={`flex items-center gap-2 h-10 ${className}`}>
      {/* Desktop label */}
      <div className="hidden sm:flex flex-col h-full">
        <span className="text-sm text-muted-foreground">Filtrar por</span>
        <span className="text-xs text-muted-foreground/70">disponibles</span>
      </div>

      {/* Mobile label */}
      <div className="sm:hidden flex flex-col justify-center items-start h-10">
        <span className="text-[12px] text-muted-foreground/80">Filtrar por</span>
        <span className="text-[12px] text-muted-foreground">disponibles</span>
      </div>

      {/* button + estados */}
      <div className="relative h-full overflow-visible">
        <div className="flex items-center gap-1 h-10">
          <div className="flex items-center gap-1 px-1 rounded-lg shadow-sm transition-all duration-200 ease-in-out transform-gpu h-full">
            <div className="h-full flex items-center">
              <Button
                aria-pressed={active}
                title={
                  active
                    ? "Mostrar solo disponibles (clic para quitar)"
                    : "Mostrar todos (clic para activar filtro)"
                }
                size="sm"
                variant={active ? "default" : "ghost"}
                onClick={() => onChange(!active)}
                className={`h-8 w-8 transition-transform duration-150 ${active ? "scale-105 shadow-md dark:text-white bg-[#95C7C3]" : ""}`}
              >
                {active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

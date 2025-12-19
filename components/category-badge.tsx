// components/category-badge.tsx
"use client";

import React, { useEffect, useState } from "react";
import { getCategoryColor } from "@/lib/category-colors";

interface CategoryBadgeProps {
  category: string;         // texto a mostrar
  seed?: string;            // semilla para calcular color (id/uuid preferible)
  className?: string;
}

export default function CategoryBadge({ category, seed, className = "" }: CategoryBadgeProps) {
  const [color, setColor] = useState<{ background: string; textColor: string } | null>(null);

  useEffect(() => {
    const s = seed ?? category ?? "";
    const c = getCategoryColor(s);
    setColor(c as any);
  }, [category, seed]);

  const style = color ? { backgroundColor: color.background, color: color.textColor } : { backgroundColor: "var(--color-primary)", color: "var(--color-primary-foreground)" };

  return (
    <div
      className={`${className} px-3 py-1 rounded-full text-xs font-medium z-10 select-none`}
      style={style}
      role="status"
      aria-label={`Categoría: ${category}`}
      title={category}
    >
      {category}
    </div>
  );
}

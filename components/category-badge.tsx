"use client";

import React, { useEffect, useState } from "react";
import { getCategoryColor } from "@/lib/category-colors";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

/**
 * Colored badge that uses getCategoryColor() client-side.
 * If color not ready yet, fallback to var(--color-primary) so SSR/client are consistent.
 */
export default function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const [color, setColor] = useState<{ background: string; textClass: string } | null>(null);

  useEffect(() => {
    const c = getCategoryColor(category || "");
    setColor(c);
  }, [category]);

  const textClass = color ? color.textClass : "text-primary-foreground";
  const style = color ? { backgroundColor: color.background } : { backgroundColor: "var(--color-primary)" };

  return (
    <div
      className={`${className} ${textClass} px-3 py-1 rounded-full text-xs font-medium z-10 select-none`}
      style={style}
      role="status"
      aria-label={`Categoría: ${category}`}
    >
      {category}
    </div>
  );
}

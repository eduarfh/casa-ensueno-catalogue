// components/category-badge.tsx
"use client";

import React from "react";
import { getCategoryColor } from "@/lib/category-colors";

interface CategoryBadgeProps {
  category: string;
  className?: string;
}

/**
 * Small client-side colored badge that uses getCategoryColor().
 * Place it on top of product images or next to titles.
 */
export default function CategoryBadge({ category, className = "" }: CategoryBadgeProps) {
  const { background, textClass } = getCategoryColor(category || "");

  return (
    <div
      className={`${className} ${textClass} px-3 py-1 rounded-full text-xs font-medium z-10 select-none`}
      style={{ backgroundColor: background }}
      role="status"
      aria-label={`Categoría: ${category}`}
    >
      {category}
    </div>
  );
}

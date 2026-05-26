// components/category-badge.tsx
"use client";

import React, { useEffect, useState } from "react";
import getCategoryColor from "@/lib/category-colors";

interface CategoryBadgeProps {
  category: string;
  seed?: string;
  className?: string;
}

export default function CategoryBadge({ category, seed, className = "" }: CategoryBadgeProps) {
  const [color, setColor] = useState<{ background: string; textColor: string } | null>(null);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const s = seed ?? category ?? "";
    const c = getCategoryColor(s);
    setColor(c);
    
    // Detectar tema oscuro
    const checkDarkMode = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    
    checkDarkMode();
    
    // Observar cambios en el tema
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    
    return () => observer.disconnect();
  }, [category, seed]);

  const style = color 
    ? { backgroundColor: color.background, color: isDark ? '#ffffff' : '#1f2937' } 
    : { backgroundColor: "var(--color-primary)", color: isDark ? '#ffffff' : '#1f2937' };

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

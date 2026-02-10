// components/image-carousel.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Si tienes el type Product en otro fichero, importa:
 * import type { Product } from "@/lib/products"
 *
 * Interfaz que mencionaste:
 * export interface Product {
 *   id: string;
 *   name: string;
 *   price?: number | null;
 *   available?: boolean | null;
 *   images?: string[] | null;
 *   category?: string | null;
 * }
 */

interface ImageCarouselProps {
  images?: string[] | null; // directamente compatible con Product['images']
  alt: string;
  autoRotate?: boolean;
  interval?: number; // ms
  className?: string;
  minHeight?: number; // opcional para controlar altura mínima (px)
}

export function ImageCarousel({
  images,
  alt,
  autoRotate = true,
  interval = 3000,
  className = "",
  minHeight = 160,
}: ImageCarouselProps) {
  // Normalize: images puede ser null | undefined | string[]
  const urls = (images ?? []).filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);

  // Mantener índice válido cuando cambia la cantidad de imágenes
  useEffect(() => {
    if (currentIndex >= urls.length) {
      setCurrentIndex(Math.max(0, urls.length - 1));
    }
    // si urls cambia normalmente queremos resetear a 0 (opcional)
    // comentar la siguiente línea si prefieres mantener el índice relativo
    // setCurrentIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urls.length]);

  // Auto-rotación
  useEffect(() => {
    if (!autoRotate || urls.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % urls.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoRotate, urls.length, interval]);

  const goToPrevious = () => {
    if (urls.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const goToNext = () => {
    if (urls.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const containerClass = `relative group ${className}`;

  // Placeholder si no hay imágenes
  if (urls.length === 0) {
    return (
      <div className={containerClass}>
        <div className="relative w-full h-full" style={{ minHeight }}>
          <Image
            src="/placeholder.svg"
            alt={alt}
            fill
            className="object-contain"
            priority={false}
          />
        </div>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className={containerClass}>
        <div className="relative w-full h-full" style={{ minHeight }}>
          <Image
            src={urls[0] || "/placeholder.svg"}
            alt={alt}
            fill
            className="object-contain transition-opacity duration-500"
            priority={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div className="relative w-full h-full" style={{ minHeight }}>
        <Image
          src={urls[currentIndex] || "/placeholder.svg"}
          alt={`${alt} - imagen ${currentIndex + 1}`}
          fill
          className="object-contain transition-opacity duration-500"
          priority={currentIndex === 0}
        />
      </div>

      {/* Botones */}
      <Button
        variant="ghost"
        size="icon"
        className="absolute left-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90"
        onClick={goToPrevious}
        aria-label="Imagen anterior"
      >
        <ChevronLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="ghost"
        size="icon"
        className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 hover:bg-white/90 dark:bg-black/80 dark:hover:bg-black/90"
        onClick={goToNext}
        aria-label="Siguiente imagen"
      >
        <ChevronRight className="h-4 w-4" />
      </Button>

      {/* Indicadores */}
      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
        {urls.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all ${
              index === currentIndex ? "bg-white w-4" : "bg-white/50 hover:bg-white/75"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a imagen ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageCarousel;

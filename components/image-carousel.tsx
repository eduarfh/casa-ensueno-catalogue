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
  adaptiveHeight?: boolean; // si true, ajusta altura según dimensiones de imagen
}

export function ImageCarousel({
  images,
  alt,
  autoRotate = true,
  interval = 3000,
  className = "",
  minHeight = 160,
  adaptiveHeight = false,
}: ImageCarouselProps) {
  // Normalize: images puede ser null | undefined | string[]
  const urls = (images ?? []).filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [imageDimensions, setImageDimensions] = useState<{ width: number; height: number } | null>(null);

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

  // Obtener dimensiones de la imagen actual si adaptiveHeight está habilitado
  useEffect(() => {
    if (!adaptiveHeight || urls.length === 0) {
      setImageDimensions(null);
      return;
    }

    const currentUrl = urls[currentIndex];
    if (!currentUrl) return;

    const img = new window.Image();
    img.onload = () => {
      setImageDimensions({ width: img.naturalWidth, height: img.naturalHeight });
    };
    img.onerror = () => {
      setImageDimensions(null);
    };
    img.src = currentUrl;
  }, [currentIndex, urls, adaptiveHeight]);

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

  const containerClass = `relative group w-full h-full ${className}`;
  const currentUrl = urls[currentIndex] || "/placeholder.svg";

  // Calcular altura basada en dimensiones si adaptiveHeight está habilitado
  let containerStyle: React.CSSProperties = {};
  if (adaptiveHeight && imageDimensions) {
    const aspectRatio = imageDimensions.width / imageDimensions.height;
    // Usar un ancho máximo razonable (ej: 600px) para calcular la altura
    const maxWidth = 600;
    const calculatedHeight = maxWidth / aspectRatio;
    containerStyle = { height: calculatedHeight, minHeight: minHeight };
  } else if (!adaptiveHeight) {
    // Si no es adaptiveHeight, usar minHeight como fallback
    containerStyle = { minHeight };
  }

  // Placeholder si no hay imágenes
  if (urls.length === 0) {
    return (
      <div className={containerClass} style={containerStyle}>
        <div className="relative w-full h-full" style={{ minHeight }}>
          {/* Fondo glasmorfismo */}
          <div className="absolute inset-0">
            <Image
              src="/placeholder.svg"
              alt={alt}
              fill
              className="object-cover blur-2xl scale-110 opacity-40"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 backdrop-blur-md" />
          </div>
          {/* Imagen principal */}
          <Image
            src="/placeholder.svg"
            alt={alt}
            fill
            className="object-contain relative z-10"
            priority={false}
          />
        </div>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <div className={containerClass} style={containerStyle}>
        <div className="relative w-full h-full" style={{ minHeight }}>
          {/* Fondo glasmorfismo */}
          <div className="absolute inset-0">
            <Image
              src={urls[0] || "/placeholder.svg"}
              alt={alt}
              fill
              className="object-cover blur-2xl scale-110 opacity-40"
              priority={false}
            />
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 backdrop-blur-md" />
          </div>
          {/* Imagen principal */}
          <Image
            src={urls[0] || "/placeholder.svg"}
            alt={alt}
            fill
            className="object-contain transition-opacity duration-500 relative z-10"
            priority={true}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={containerClass} style={containerStyle}>
      <div className="relative w-full h-full" style={{ minHeight }}>
        {/* Fondo glasmorfismo */}
        <div className="absolute inset-0">
          <Image
            src={currentUrl}
            alt={alt}
            fill
            className="object-cover blur-2xl scale-110 opacity-40"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-black/10 backdrop-blur-md" />
        </div>
        {/* Imagen principal */}
        <Image
          src={currentUrl}
          alt={`${alt} - imagen ${currentIndex + 1}`}
          fill
          className="object-contain transition-opacity duration-500 relative z-10"
          priority={currentIndex === 0}
        />
      </div>

      {/* Botones de navegación */}
      <button
        onClick={goToPrevious}
        aria-label="Imagen anterior"
        className="absolute left-3 top-1/2 -translate-y-1/2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-white shadow-lg"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>

      <button
        onClick={goToNext}
        aria-label="Siguiente imagen"
        className="absolute right-3 top-1/2 -translate-y-1/2 z-20 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity duration-200 p-2 rounded-full bg-black/60 hover:bg-black/80 text-white hover:text-white shadow-lg"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Indicadores */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2 z-10 bg-black/40 px-3 py-2 rounded-full backdrop-blur-sm">
        {urls.map((_, index) => (
          <button
            key={index}
            className={`transition-all duration-200 rounded-full ${
              index === currentIndex 
                ? "bg-white w-2 h-2" 
                : "bg-white/60 hover:bg-white/80 w-2 h-2"
            }`}
            onClick={() => setCurrentIndex(index)}
            aria-label={`Ir a imagen ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
  );
}

export default ImageCarousel;

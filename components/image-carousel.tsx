// components/image-carousel.tsx
"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ImageFullscreenModal } from "@/components/image-fullscreen-modal";

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
  enableFullscreen?: boolean; // habilitar vista en pantalla completa al hacer clic
  minHeight?: number; // altura mínima en px (opcional)
}

export function ImageCarousel({
  images,
  alt,
  autoRotate = true,
  interval = 3000,
  className = "",
  enableFullscreen = false,
  minHeight = 160,
}: ImageCarouselProps) {
  // Normalize: images puede ser null | undefined | string[]
  const urls = (images ?? []).filter(Boolean);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);

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
    if (!autoRotate || urls.length <= 1 || isFullscreenOpen) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % urls.length);
    }, interval);
    return () => clearInterval(timer);
  }, [autoRotate, urls.length, interval, isFullscreenOpen]);

  const goToPrevious = () => {
    if (urls.length === 0) return;
    setCurrentIndex((prev) => (prev - 1 + urls.length) % urls.length);
  };

  const goToNext = () => {
    if (urls.length === 0) return;
    setCurrentIndex((prev) => (prev + 1) % urls.length);
  };

  const handleImageClick = () => {
    if (enableFullscreen && urls.length > 0) {
      setIsFullscreenOpen(true);
    }
  };

  const containerClass = `relative group ${className}`;
  
  // Cursor pointer si fullscreen está habilitado
  const cursorClass = enableFullscreen ? "cursor-pointer" : "";

  // Placeholder si no hay imágenes
  if (urls.length === 0) {
    return (
      <div className={containerClass}>
        <div className="relative w-full h-full" style={{ minHeight }}>
          <Image
            src="/placeholder.svg"
            alt={alt}
            fill
            className="object-cover"
            priority={false}
          />
        </div>
      </div>
    );
  }

  if (urls.length === 1) {
    return (
      <>
        <div className={containerClass}>
          <div 
            className={`relative w-full h-full ${cursorClass}`}
            style={{ minHeight }}
            onClick={handleImageClick}
            role={enableFullscreen ? "button" : undefined}
            aria-label={enableFullscreen ? "Ver imagen en pantalla completa" : undefined}
            tabIndex={enableFullscreen ? 0 : undefined}
            onKeyDown={enableFullscreen ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                handleImageClick();
              }
            } : undefined}
          >
            <Image
              src={urls[0] || "/placeholder.svg"}
              alt={alt}
              fill
              className="object-cover transition-opacity duration-500"
              priority={true}
            />
          </div>
        </div>
        
        {enableFullscreen && (
          <ImageFullscreenModal
            images={urls}
            initialIndex={0}
            isOpen={isFullscreenOpen}
            onClose={() => setIsFullscreenOpen(false)}
            alt={alt}
          />
        )}
      </>
    );
  }

  return (
    <>
      <div className={containerClass}>
        <div 
          className={`relative w-full h-full ${cursorClass}`}
          style={{ minHeight }}
          onClick={handleImageClick}
          role={enableFullscreen ? "button" : undefined}
          aria-label={enableFullscreen ? "Ver imagen en pantalla completa" : undefined}
          tabIndex={enableFullscreen ? 0 : undefined}
          onKeyDown={enableFullscreen ? (e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.preventDefault();
              handleImageClick();
            }
          } : undefined}
        >
          <Image
            src={urls[currentIndex] || "/placeholder.svg"}
            alt={`${alt} - imagen ${currentIndex + 1}`}
            fill
            className="object-cover transition-opacity duration-500"
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
            onClick={(e) => {
              e.stopPropagation();
              setCurrentIndex(index);
            }}
            aria-label={`Ir a imagen ${index + 1}`}
            aria-current={index === currentIndex}
          />
        ))}
      </div>
    </div>
    
    {enableFullscreen && (
      <ImageFullscreenModal
        images={urls}
        initialIndex={currentIndex}
        isOpen={isFullscreenOpen}
        onClose={() => setIsFullscreenOpen(false)}
        alt={alt}
      />
    )}
    </>
  );
}

export default ImageCarousel;

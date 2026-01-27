"use client";

import Image from "next/image";
import React, { useEffect, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface ImageItem {
  id?: string;
  url: string;
  // opcional: width?: number; height?: number;
}

interface ProductImageGalleryProps {
  images: ImageItem[];
  autoPlayInterval?: number; // ms
  className?: string;
}

export function ProductImageGallery({ images, autoPlayInterval = 3500, className = "" }: ProductImageGalleryProps) {
  const imgs = Array.isArray(images) && images.length ? images.map((i) => i.url ?? "") : ["/placeholder.svg"];
  const [index, setIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const autoplayRef = useRef<number | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);
  const draggingRef = useRef(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  useEffect(() => setIndex(0), [images]);
  useEffect(() => setImgLoaded(false), [index]);

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i - 1 + imgs.length) % imgs.length);
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i + 1) % imgs.length);
  };

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (ev.key === "ArrowLeft") prev();
      if (ev.key === "ArrowRight") next();
      if (ev.key === "Escape") setLightboxOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [imgs.length]);

  // swipe/drag (igual que tenías)
  useEffect(() => {
    const el = containerRef.current;
    if (!el || imgs.length < 2) return;
    let startX = 0;
    let dx = 0;
    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      draggingRef.current = false;
      setIsInteracting(true);
      try {
        el.setPointerCapture?.((e as any).pointerId);
      } catch {}
    };
    const onPointerMove = (e: PointerEvent) => {
      dx = e.clientX - startX;
      if (Math.abs(dx) > 8) draggingRef.current = true;
    };
    const onPointerUp = () => {
      if (Math.abs(dx) > 40) {
        if (dx < 0) setIndex((i) => (i + 1) % imgs.length);
        else setIndex((i) => (i - 1 + imgs.length) % imgs.length);
      }
      dx = 0;
      setTimeout(() => {
        draggingRef.current = false;
        setIsInteracting(false);
      }, 80);
    };
    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    el.addEventListener("pointercancel", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      el.removeEventListener("pointercancel", onPointerUp);
    };
  }, [imgs.length]);

  useEffect(() => {
    if (imgs.length < 2) return;
    if (isInteracting) return;
    const id = window.setInterval(() => {
      setIndex((i) => (i + 1) % imgs.length);
    }, autoPlayInterval);
    autoplayRef.current = id;
    return () => {
      if (autoplayRef.current) {
        clearInterval(autoplayRef.current);
        autoplayRef.current = null;
      }
    };
  }, [imgs.length, autoPlayInterval, isInteracting]);

  return (
    <>
      <div
        ref={containerRef}
        className={`relative w-full rounded-md overflow-hidden bg-muted ${className}`}
        tabIndex={0}
        onMouseEnter={() => setIsInteracting(true)}
        onMouseLeave={() => setIsInteracting(false)}
        onFocus={() => setIsInteracting(true)}
        onBlur={() => setIsInteracting(false)}
        aria-roledescription="carousel"
        aria-label="Galería de imágenes"
      >
        {/* Contenedor flexible: quitamos aspect fijo para que la imagen se muestre completa.
            Si quieres limitar la altura, sustituir `max-h-[70vh]` por lo que necesites. */}
        <div className="relative w-full h-auto max-h-[70vh] flex items-center justify-center bg-black/5">
          <Image
            src={imgs[index] ?? "/placeholder.svg"}
            alt={`Imagen ${index + 1}`}
            fill
            style={{ objectFit: "contain" }} // <-- evita recorte
            className={`transition-opacity duration-300 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
          />
        </div>

        {/* Prev / Next */}
        {imgs.length > 1 && (
          <>
            <button
              onClick={prev}
              aria-label="Imagen anterior"
              className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              type="button"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              onClick={next}
              aria-label="Siguiente imagen"
              className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              type="button"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            {/* Indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-2">
              {imgs.map((_, i) => (
                <button
                  key={i}
                  onClick={(e) => {
                    e.stopPropagation();
                    setIndex(i);
                  }}
                  aria-label={`Ir a la imagen ${i + 1}`}
                  className={`w-2 h-2 rounded-full ${i === index ? "bg-white" : "bg-white/50"}`}
                  type="button"
                />
              ))}
            </div>
          </>
        )}

        {/* Botón para abrir la imagen original en nueva pestaña */}
        <div className="absolute top-3 right-3 flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              window.open(imgs[index], "_blank", "noopener");
            }}
            className="text-sm px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur"
            type="button"
            aria-label="Abrir imagen en tamaño original"
          >
            Ver original
          </button>

          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightboxOpen(true);
            }}
            className="text-sm px-3 py-1 rounded-md bg-white/20 hover:bg-white/30 backdrop-blur"
            type="button"
            aria-label="Abrir lightbox"
          >
            Ampliar
          </button>
        </div>
      </div>

      {/* Lightbox simple */}
      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          onClick={() => setLightboxOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="max-w-[95vw] max-h-[95vh] overflow-auto">
            {/* Usamos img nativa para que el navegador muestre la resolución real y permita guardar */}
            <img
              src={imgs[index]}
              alt={`Imagen ampliada ${index + 1}`}
              style={{ maxWidth: "100%", maxHeight: "100%", display: "block", margin: "0 auto" }}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default ProductImageGallery;

"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CategoryBadge from "@/components/category-badge";

interface Category {
  id?: string;
  uuid?: string;
  name?: string;
  title?: string;
  [key: string]: any;
}

interface ProductCardProps {
  id: string;
  name: string;
  price?: number | string | null;
  images?: (string | { url?: string })[] | null;
  available?: boolean | number | string | null;
  categories?: (Category | string)[] | null;
  // nombre legible que mostraremos
  category?: string | null;
  // seed que usará getCategoryColor (debe coincidir con el usado en CategoryFilter)
  categorySeed?: string | null;
}

export function ProductCard({
  id,
  name,
  price,
  images = [],
  available = true,
  categories,
  category,
  categorySeed,
}: ProductCardProps) {
  const [isSharing, setIsSharing] = useState(false);
  const { toast } = useToast();

  const rawPrice =
    typeof price === "number"
      ? price
      : typeof price === "string"
      ? Number(price)
      : Number(price ?? 0);
  const displayPrice = Number.isFinite(rawPrice) ? rawPrice : 0;
  const priceString = displayPrice.toFixed(2);

  const productUrl =
    typeof window !== "undefined" ? `${window.location.origin}/product/${id}` : `/product/${id}`;

  const handleShare = async () => {
    setIsSharing(true);
    try {
      if (typeof navigator !== "undefined" && (navigator as any).share) {
        await (navigator as any).share({
          title: name,
          text: `Mira este producto: ${name} - $${priceString}`,
          url: productUrl,
        });
        toast({ title: "Compartido", description: "Producto compartido correctamente." });
      } else if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(productUrl);
        toast({ title: "Enlace copiado", description: "El enlace del producto se copió al portapapeles." });
      } else if (typeof window !== "undefined") {
        window.open(productUrl, "_blank");
        toast({ title: "Abrir", description: "Abriendo el producto en una nueva pestaña." });
      } else {
        toast({ title: "No disponible", description: "No se puede compartir desde este entorno.", variant: "destructive" });
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast({ title: "Error al compartir", description: "Ocurrió un problema al intentar compartir el producto.", variant: "destructive" });
    } finally {
      setIsSharing(false);
    }
  };

  const handleWhatsApp = () => {
    const message = encodeURIComponent(`Hola, me interesa el producto: ${name} - $${priceString}`);
    const whatsappUrl = `https://wa.me/5352490476?text=${message}`;
    if (typeof window !== "undefined") window.open(whatsappUrl, "_blank");
  };

  // Helper: extraer nombre y semilla (seed) si vienen como categories[] (guardamos como fallback)
  const extractCategory = (item: Category | string | null | undefined): { name: string; seed: string } | null => {
    if (item === null || item === undefined) return null;
    if (typeof item === "string") {
      const trimmed = item.trim();
      if (!trimmed) return null;
      return { name: trimmed, seed: trimmed };
    }
    if (typeof item === "object") {
      const name = (item.name || item.title || item.id || item.uuid || "").toString();
      if (!name) return null;
      const seed = (item.id ?? item.uuid ?? name).toString();
      return { name, seed };
    }
    return null;
  };

  const parsedCats = (Array.isArray(categories) ? categories : [])
    .map((c) => extractCategory(c))
    .filter(Boolean) as { name: string; seed: string }[];

  // PRIORIDAD para category display:
  // 1) prop category (nombre legible) y categorySeed (semilla que asegura color igual al filtro)
  // 2) si no vienen, fallback a parsedCats[0]
  const displayName = category ?? (parsedCats.length > 0 ? parsedCats[0].name : null);
  const displaySeed = categorySeed ?? (parsedCats.length > 0 ? parsedCats[0].seed : null);

  // normalizar images: aceptar string o { url }
  const imgs = Array.isArray(images)
    ? images
        .map((it) => {
          if (!it) return "";
          return typeof it === "string" ? it : (it as any).url ?? "";
        })
        .filter(Boolean)
    : [];

  const normalizedImgs: string[] = imgs.length ? imgs : ["/placeholder.svg"];

  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    setIndex(0);
  }, [images]);

  useEffect(() => {
    setImgLoaded(false);
  }, [index]);

  const prev = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i - 1 + normalizedImgs.length) % normalizedImgs.length);
  };
  const next = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIndex((i) => (i + 1) % normalizedImgs.length);
  };

  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (ev.key === "ArrowLeft") prev();
      if (ev.key === "ArrowRight") next();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [normalizedImgs.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || normalizedImgs.length < 2) return;
    let startX = 0;
    let dx = 0;
    const onPointerDown = (e: PointerEvent) => {
      startX = e.clientX;
      try {
        el.setPointerCapture?.((e as any).pointerId);
      } catch {}
    };
    const onPointerMove = (e: PointerEvent) => {
      dx = e.clientX - startX;
    };
    const onPointerUp = () => {
      if (Math.abs(dx) > 40) {
        if (dx < 0) setIndex((i) => (i + 1) % normalizedImgs.length);
        else setIndex((i) => (i - 1 + normalizedImgs.length) % normalizedImgs.length);
      }
      dx = 0;
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
  }, [normalizedImgs.length]);

  const showControls = normalizedImgs.length > 1;
  const isAvailable = available === true || available === 1 || available === "1";

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/40 bg-card group p-2 gap-2 rounded-md h-full">
      <Link href={`/product/${id}`} className="block relative overflow-hidden bg-muted aspect-[4/3]" aria-label={`Ver ${name}`}>
        <div
          ref={containerRef}
          className="w-full h-full relative"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={`${name} imágenes`}
        >
          <Image
            src={normalizedImgs[index] ?? "/placeholder.svg"}
            alt={`${name} imagen ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            style={{ objectFit: "cover" }}
            className={`group-hover:scale-105 transition-transform duration-350 transition-opacity ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoadingComplete={() => setImgLoaded(true)}
            loading={index === 0 ? "eager" : "lazy"}
            priority={false}
          />

          {/* BADGE PRINCIPAL DE CATEGORÍA — usamos displayName y displaySeed */}
          <div className="absolute top-2 left-2 z-20">
            {displayName ? (
              <CategoryBadge category={displayName} seed={displaySeed ?? undefined} className="px-3 py-1 text-xs font-medium" />
            ) : null}
          </div>

          {/* AVAILABILITY BADGE — esquina superior derecha */}
          <div className="absolute top-2 right-2 z-20">
            {isAvailable ? (
              <Badge title="Disponible" aria-label="Producto disponible" className="text-xs py-0.5 px-2">
                Disponible
              </Badge>
            ) : (
              <Badge variant="destructive" title="Agotado" aria-label="Producto agotado" className="text-xs py-0.5 px-2">
                Agotado
              </Badge>
            )}
          </div>

          {showControls && (
            <>
              <button
                onClick={prev}
                aria-label="Imagen anterior"
                className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                type="button"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <button
                onClick={next}
                aria-label="Siguiente imagen"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white p-1.5 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                type="button"
              >
                <ChevronRight className="w-4 h-4" />
              </button>

              <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-2">
                {normalizedImgs.map((_, i) => {
                  const isActive = i === index;
                  return (
                    <button
                      key={i}
                      onClick={(e) => {
                        e.stopPropagation();
                        setIndex(i);
                      }}
                      aria-label={`Ir a la imagen ${i + 1}`}
                      className={`w-2 h-2 rounded-full ${isActive ? "bg-white" : "bg-white/50"}`}
                      type="button"
                    />
                  );
                })}
              </div>
            </>
          )}
        </div>
      </Link>

      <div className="px-2 pb-2 space-y-1 flex flex-col flex-1">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            <Link href={`/product/${id}`}>{name}</Link>
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-primary">${priceString}</span>
        </div>

        <div className="flex gap-2 mt-2">
          <Button
            asChild
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            disabled={!isAvailable}
            onClick={(e: any) => {
              if (!isAvailable) e.preventDefault();
            }}
          >
            <Link href={`/product/${id}`}>Ver</Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleShare();
            }}
            disabled={isSharing}
            className="p-1.5"
            title="Compartir producto"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={(e) => {
              e.stopPropagation();
              handleWhatsApp();
            }}
            className="p-1.5"
            title="Contactar por WhatsApp"
          >
            <MessageCircle className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}

export default ProductCard;

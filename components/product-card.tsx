// components/product-card.tsx
"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Share2, MessageCircle, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Category {
  id: string;
  name: string;
}

interface ProductCardProps {
  id: string;
  name: string;
  price?: number | string | null;
  images?: string[] | null;
  available?: boolean | null;
  categories?: Category[] | null;
}

export function ProductCard({
  id,
  name,
  price,
  images = [],
  available = true,
  categories,
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

  const firstCategoryName = categories && categories.length > 0 ? categories[0].name : null;

  const imgs = images && images.length > 0 ? images : ["/placeholder.svg"];
  const [index, setIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setIndex(0);
  }, [images]);

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
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [imgs.length]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el || imgs.length < 2) return;
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
        if (dx < 0) setIndex((i) => (i + 1) % imgs.length);
        else setIndex((i) => (i - 1 + imgs.length) % imgs.length);
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
  }, [imgs.length]);

  const showControls = imgs.length > 1;

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/40 bg-card group p-2 gap-2 rounded-md">
      <Link href={`/product/${id}`} className="block relative overflow-hidden bg-muted aspect-[4/3]" aria-label={`Ver ${name}`}>
        <div
          ref={containerRef}
          className="w-full h-full relative"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={`${name} imágenes`}
        >
          <Image
            src={imgs[index] ?? "/placeholder.svg"}
            alt={`${name} imagen ${index + 1}`}
            fill
            sizes="(max-width: 768px) 100vw, 25vw"
            className="object-cover group-hover:scale-105 transition-transform duration-350"
          />

          {!available && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
              <Badge className="text-sm py-1 px-3 bg-destructive shadow-md">Agotado</Badge>
            </div>
          )}

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
                {imgs.map((_, i) => {
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

      <div className="px-2 pb-2 space-y-1">
        <div>
          <h3 className="font-semibold text-sm line-clamp-2 hover:text-primary transition-colors">
            <Link href={`/product/${id}`}>{name}</Link>
          </h3>
          <div className="flex items-center gap-2 mt-0.5">
            {firstCategoryName ? (
              <span className="text-xs text-muted-foreground">{firstCategoryName}</span>
            ) : (
              <span className="text-xs text-muted-foreground">{available ? "Disponible" : "Sin stock"}</span>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-semibold text-primary">${priceString}</span>
        </div>

        <div className="flex gap-2 mt-1">
          <Button
            asChild
            size="sm"
            className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground text-xs"
            disabled={!available}
            onClick={(e: any) => {
              if (!available) e.preventDefault();
            }}
          >
            <Link href={`/product/${id}`}>Ver</Link>
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleShare}
            disabled={isSharing}
            className="p-1.5"
            title="Compartir producto"
          >
            <Share2 className="w-4 h-4" />
          </Button>

          <Button
            size="sm"
            variant="outline"
            onClick={handleWhatsApp}
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

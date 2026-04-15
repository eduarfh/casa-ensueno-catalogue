"use client";

import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Share2, MessageCircle } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useToast } from "@/hooks/use-toast";
import CategoryBadge from "@/components/category-badge";
import ImageCarousel from "@/components/image-carousel";

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
  category?: string | null;
  categorySeed?: string | null;
  compact?: boolean;
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
  compact = false,
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
  const priceString = displayPrice % 1 === 0 ? displayPrice.toString() : displayPrice.toFixed(2);

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
    const payload = { productName: name ?? "", price: priceString };
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("open-whatsapp-contacts", { detail: payload }));
    }
  };

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

  const displayName = category ?? (parsedCats.length > 0 ? parsedCats[0].name : null);
  const displaySeed = categorySeed ?? (parsedCats.length > 0 ? parsedCats[0].seed : null);

  const imgs = Array.isArray(images)
    ? images
        .map((it) => {
          if (!it) return "";
          return typeof it === "string" ? it : (it as any).url ?? (it as any).image_url ?? "";
        })
        .filter(Boolean)
    : [];

  const normalizedImgs: string[] = imgs.length ? imgs : ["/placeholder.svg"];

  if (compact) {
    const imgSrc = normalizedImgs[0] ?? "/placeholder.svg";
    const isAvailable = available === true || available === 1 || available === "1";

    return (
      <div className="rounded-md overflow-hidden border bg-card group p-1 h-full">
        <Link href={`/product/${id}`} className="flex gap-2 items-center">
          <div className="relative w-20 h-20 flex-shrink-0 rounded-md overflow-hidden bg-muted">
            <Image src={imgSrc} alt={name ?? "Producto"} fill style={{ objectFit: "cover" }} loading="lazy" />
          </div>

          <div className="flex-1 min-w-0">
            <h4 className="text-sm font-medium line-clamp-2">{name}</h4>
            <div className="mt-1 flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground line-clamp-1">{displayName ?? "Sin categoría"}</span>
              <span className="text-sm font-semibold text-primary">${priceString}</span>
            </div>
          </div>
        </Link>
      </div>
    );
  }

  // Full card (uses ImageCarousel)
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [isInteracting, setIsInteracting] = useState(false);

  const showControls = normalizedImgs.length > 1;
  const isAvailable = available === true || available === 1 || available === "1";

  // autoplay interval (ms)
  const AUTOPLAY_INTERVAL = 4500;

  // Prevent navigation on click when dragging or clicking controls
  const onImageLinkClick = (e: React.MouseEvent) => {
    if ((e as any).defaultPrevented) return;
    // If we detected a drag (we set isInteracting while pointer moving), prevent navigation.
    // also prevent navigation if the click originated from a control (button, [role='button'], .no-link)
    const target = e.target as HTMLElement | null;
    try {
      if (target) {
        if (target.closest("button, [role='button'], .no-link")) {
          e.preventDefault();
          e.stopPropagation();
          return;
        }
      }
    } catch (err) {
      // ignore
    }
  };

  // pointer down/up to mark interaction (pauses autoplay)
  const onImageLinkPointerDown = () => setIsInteracting(true);
  const onImageLinkPointerUp = () => setTimeout(() => setIsInteracting(false), 150);

  // Keyboard navigation: delegate to the carousel's prev/next buttons by clicking them
  useEffect(() => {
    const handler = (ev: KeyboardEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(document.activeElement)) return;
      if (ev.key === "ArrowLeft") {
        const prevBtn = containerRef.current.querySelector<HTMLButtonElement>('button[aria-label="Imagen anterior"]');
        prevBtn?.click();
      }
      if (ev.key === "ArrowRight") {
        const nextBtn = containerRef.current.querySelector<HTMLButtonElement>('button[aria-label="Siguiente imagen"]');
        nextBtn?.click();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <Card
      className={
        "overflow-hidden hover:shadow-lg transition-all duration-200 hover:border-primary/40 bg-card group p-2 md:p-3 gap-2 rounded-md h-full transform-gpu scale-95 md:scale-100"
      }
    >
      <Link
        href={`/product/${id}`}
        className="block relative overflow-hidden bg-muted aspect-[3/4]"
        aria-label={`Ver ${name}`}
        onClick={onImageLinkClick}
        onPointerDown={onImageLinkPointerDown}
        onPointerUp={onImageLinkPointerUp}
      >
        <div
          ref={containerRef}
          className="w-full h-full relative"
          tabIndex={0}
          aria-roledescription="carousel"
          aria-label={`${name} imágenes`}
          onMouseEnter={() => setIsInteracting(true)}
          onMouseLeave={() => setIsInteracting(false)}
          onFocus={() => setIsInteracting(true)}
          onBlur={() => setIsInteracting(false)}
        >
          <ImageCarousel
            images={normalizedImgs}
            alt={name || "Producto"}
            autoRotate={showControls && !isInteracting}
            interval={AUTOPLAY_INTERVAL}
            className="w-full h-full"
            variant="card"
          />

          <div className="absolute top-2 right-2 z-10">
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
        </div>
      </Link>

      <div className="px-2 pb-2 space-y-1 flex flex-col flex-1">
        <div>
          <h3 className="font-semibold text-sm md:text-base line-clamp-2 hover:text-primary transition-colors">
            <Link href={`/product/${id}`}>{name}</Link>
          </h3>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg md:text-xl font-semibold text-primary">{priceString} CUP</span>
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

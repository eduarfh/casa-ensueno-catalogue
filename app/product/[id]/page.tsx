// app/product/[id]/page.tsx
import { createPublicServerClient, createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ShoppingCart } from "lucide-react";
// import { ProductImageGallery } from "@/components/product-image-gallery";
import ImageCarousel from "@/components/image-carousel";
import ProductShareButtons from "@/components/product-share-buttons";
import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import StoreInfo from "@/components/store-info";

interface ParamsShape {
  params: Promise<{
    id: string;
  }>;
}

/**
 * Convierte una URL relativa (p.ej. path en storage) en una URL absoluta usando NEXT_PUBLIC_BASE_URL.
 * Si la URL ya es absoluta (http(s)://) la devuelve tal cual.
 */
function makeAbsoluteUrl(maybeUrl?: string | null) {
  if (!maybeUrl) return undefined;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  return `${base.replace(/\/$/, "")}/${maybeUrl.replace(/^\//, "")}`;
}

export async function generateMetadata({ params }: ParamsShape): Promise<Metadata> {
  const { id } = await params;

  const supabase = createPublicServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      available,
      product_images(id, image_url, display_order),
      category
    `)
    .eq("id", id)
    .single();

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  // elegir la primera imagen ordenada por display_order (si existe)
  const firstImage =
    Array.isArray(product.product_images) && product.product_images.length > 0
      ? product.product_images
          .slice()
          .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))[0]
      : undefined;

  const firstImageUrl = makeAbsoluteUrl(firstImage?.image_url ?? undefined);

  return {
    title: product.name,
    description: product.description || `${product.name} - $${product.price ?? 0}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - $${product.price ?? 0}`,
      type: "website",
      images: firstImageUrl ? [firstImageUrl] : undefined,
    },
    twitter: {
      card: firstImageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description: product.description || `${product.name} - $${product.price ?? 0}`,
    },
  };
}

export default async function ProductPage({ params }: ParamsShape) {
  const { id } = await params;
  const supabase = await createServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      available,
      category,
      product_images(id, image_url, display_order)
    `)
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // URL absoluta de la página del producto (no es la URL de supabase/storage)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productUrl = `${baseUrl.replace(/\/$/, "")}/product/${id}`;

  // obtener la primera imagen (si hay) y construir su URL absoluta
  const firstImage = (product.product_images || [])
    .slice()
    .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))[0];

  const firstImageUrl = makeAbsoluteUrl(firstImage?.image_url);

  // Mapear product_images a string[] de URLs absolutas para ImageCarousel
  const imageUrls: string[] =
    (product.product_images || [])
      .slice()
      .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
      .map((img: any) => makeAbsoluteUrl(img.image_url) ?? "")
      .filter(Boolean) || [];

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/catalog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-6 transition-colors font-medium"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al catálogo
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="w-full h-80 sm:h-96 md:h-[500px] lg:h-[600px]">
            <ImageCarousel
              images={imageUrls.length ? imageUrls : undefined}
              alt={product.name ?? "Producto"}
              autoRotate={true}
              interval={4500}
              minHeight={320}
              adaptiveHeight={false}
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3 text-balance">{product.name}</h1>
                </div>
              </div>

              <div className="flex items-baseline gap-3 py-4">
                <span className="text-5xl font-bold text-primary">
                  ${Number(product.price ?? 0).toFixed(2)}{" "}
                  <span className="text-foreground">CUP</span>
                </span>
              </div>
            </div>

            <Card className="p-5 bg-muted/10 border-muted">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-secondary" />
                Información del Producto
              </h3>

              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground font-medium">Disponibilidad:</dt>
                  <dd className="font-semibold text-foreground">
                    {product.available ? "Disponible" : "No disponible"}
                  </dd>
                </div>

                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground font-medium">Categoría:</dt>
                  <dd className="font-semibold text-foreground">
                    {product.category ?? "Sin categoría"}
                  </dd>
                </div>

                <div>
                  <dt className="text-muted-foreground font-medium mb-2">Descripción:</dt>
                  <dd className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {product.description ?? "Sin descripción disponible."}
                  </dd>
                </div>
              </dl>
            </Card>

            <ProductShareButtons
              productUrl={productUrl}
              productName={product.name}
              productPrice={Number(product.price ?? 0)}
              productImage={firstImageUrl ?? undefined}
            />
          </div>
        </div>
      </main>

      <footer>
        <StoreInfo />
      </footer>
    </div>
  );
}

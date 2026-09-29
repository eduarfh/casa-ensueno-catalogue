// app/product/[id]/page.tsx
import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import ImageCarousel from "@/components/image-carousel";
import ProductShareButtons from "@/components/product-share-buttons";
import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import StoreInfo from "@/components/store-info";
import { getStoragePublicUrl } from "@/lib/storage-utils";
import ScrollToTop from "@/components/scroll-to-top";

interface ParamsShape {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: ParamsShape): Promise<Metadata> {
  const { id } = await params;

  const result = await query(`
    SELECT p.*, 
      json_agg(
        json_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'display_order', pi.display_order
        ) ORDER BY pi.display_order
      ) FILTER (WHERE pi.id IS NOT NULL) as product_images,
      (
        SELECT json_agg(
          json_build_object(
            'currency_code', c.code,
            'currency_symbol', c.symbol,
            'price', pc.price
          ) ORDER BY c.display_order
        )
        FROM product_currencies pc
        JOIN currencies c ON pc.currency_id = c.id AND c.is_active = true
        WHERE pc.product_id = p.id
      ) as currencies
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = $1
    GROUP BY p.id
  `, [id]);

  const product = result.rows[0];

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  // elegir la primera imagen ordenada por display_order (si existe)
  const firstImage =
    Array.isArray(product.product_images) && product.product_images.length > 0
      ? product.product_images[0]
      : undefined;

  const firstImageUrl = getStoragePublicUrl(firstImage?.image_url ?? undefined);

  // Formatear precio con monedas
  const currencies = product.currencies || [];
  const priceDescription = currencies.length > 0
    ? currencies.map((c: any) => `${c.currency_symbol || '$'}${c.price} ${c.currency_code || ''}`).join(' / ')
    : `$${product.price ?? 0}`;

  return {
    title: product.name,
    description: product.description || `${product.name} - ${priceDescription}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - ${priceDescription}`,
      type: "website",
      images: firstImageUrl ? [firstImageUrl] : undefined,
    },
    twitter: {
      card: firstImageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description: product.description || `${product.name} - ${priceDescription}`,
    },
  };
}

export default async function ProductPage({ params }: ParamsShape) {
  const { id } = await params;

  const result = await query(`
    SELECT p.*, 
      json_agg(
        json_build_object(
          'id', pi.id,
          'image_url', pi.image_url,
          'display_order', pi.display_order
        ) ORDER BY pi.display_order
      ) FILTER (WHERE pi.id IS NOT NULL) as product_images,
      (
        SELECT json_agg(
          json_build_object(
            'currency_code', c.code,
            'currency_symbol', c.symbol,
            'currency_name', c.name,
            'price', pc.price
          ) ORDER BY c.display_order
        )
        FROM product_currencies pc
        JOIN currencies c ON pc.currency_id = c.id AND c.is_active = true
        WHERE pc.product_id = p.id
      ) as currencies
    FROM products p
    LEFT JOIN product_images pi ON p.id = pi.product_id
    WHERE p.id = $1
    GROUP BY p.id
  `, [id]);

  const product = result.rows[0];

  if (!product) {
    notFound();
  }

  // URL absoluta de la página del producto
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const productUrl = `${baseUrl.replace(/\/$/, "")}/product/${id}`;

  // obtener la primera imagen (si hay) y construir su URL absoluta
  const firstImage = (product.product_images || [])[0];
  const firstImageUrl = getStoragePublicUrl(firstImage?.image_url);

  // Mapear product_images a string[] de URLs absolutas para ImageCarousel
  const imageUrls: string[] =
    (product.product_images || [])
      .map((img: any) => getStoragePublicUrl(img.image_url) ?? "")
      .filter(Boolean) || [];

  // Formatear las monedas para mostrar
  const currencies = product.currencies || [];
  const formattedCurrencies = currencies.length > 0
    ? currencies.map((c: any) => {
        const price = typeof c.price === "number" ? c.price : Number(c.price || 0);
        const priceStr = price % 1 === 0 ? price.toString() : price.toFixed(2);
        return `${priceStr} ${c.currency_code || ''}`;
      }).join(' / ')
    : `${Number(product.price ?? 0) % 1 === 0 ? Number(product.price ?? 0).toString() : Number(product.price ?? 0).toFixed(2)} CUP`;

  return (
    <div className="min-h-screen bg-background">
      <ScrollToTop />
      <SiteHeader />
      {/* Espaciador para compensar el header fixed */}
      <div className="h-24 sm:h-28 md:h-32" />

      <main className="container mx-auto px-4 py-8">
        <Button variant="outline" size="sm" asChild className="mb-6">
          <Link href="/catalog">
            <ChevronLeft className="w-4 h-4 text-#dfcfb4" />
            Volver
          </Link>
        </Button>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <ImageCarousel
              images={imageUrls.length ? imageUrls : undefined}
              alt={product.name ?? "Producto"}
              autoRotate={true}
              interval={4500}
              className="rounded-lg overflow-hidden shadow-lg"
              enableFullscreen={true}
              minHeight={400}
            />
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex items-start justify-between gap-4 mb-1">
                <div className="flex-1">
                  <h1 className="text-2xl font-bold mb-3 text-balance">{product.name}</h1>
                </div>
              </div>

              <div className="flex items-baseline gap-3 py-1">
                <span className="text-3xl font-bold text-primary">
                  {formattedCurrencies}
                </span>
              </div>
            </div>

            <Card className="p-5 bg-muted/50 border-muted">
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
                  <dd className="text-sm text-foreground leading-relaxed whitespace-pre-line font-semibold">
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

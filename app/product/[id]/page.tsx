// app/product/[id]/page.tsx
import { query } from "@/lib/db";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import ImageCarousel from "@/components/image-carousel";
import ProductShareButtons from "@/components/product-share-buttons";
import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import StoreInfo from "@/components/store-info";
import { getStoragePublicUrl } from "@/lib/storage-utils";

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
      ) FILTER (WHERE pi.id IS NOT NULL) as product_images
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

  return {
    title: product.name,
    description: product.description || `${product.name} - ${product.price ?? 0}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - ${product.price ?? 0}`,
      type: "website",
      images: firstImageUrl ? [firstImageUrl] : undefined,
    },
    twitter: {
      card: firstImageUrl ? "summary_large_image" : "summary",
      title: product.name,
      description: product.description || `${product.name} - ${product.price ?? 0}`,
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
      ) FILTER (WHERE pi.id IS NOT NULL) as product_images
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
              <div className="flex items-start justify-between gap-4 mb-4">
                <div className="flex-1">
                  <h1 className="text-4xl font-bold mb-3 text-balance">{product.name}</h1>
                </div>
              </div>

              <div className="flex items-baseline gap-3 py-4">
                <span className="text-5xl font-bold text-primary">
                  ${Number(product.price ?? 0) % 1 === 0 ? Number(product.price ?? 0).toString() : Number(product.price ?? 0).toFixed(2)}{" "}
                  <span className="text-foreground">CUP</span>
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

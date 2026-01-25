// app/product/[id]/page.tsx
import { createPublicServerClient, createServerClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, ShoppingCart } from "lucide-react";
import { ProductImageGallery } from "@/components/product-image-gallery";
import { ProductShareButtons } from "@/components/product-share-buttons";
import SiteHeader from "@/components/site-header";
import type { Metadata } from "next";
import StoreInfo from "@/components/store-info";

interface ParamsShape {
  params: Promise<{
    id: string;
  }>;
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
      product_images(image_url),
      category
    `)
    .eq("id", id)
    .single();

  if (!product) {
    return {
      title: "Producto no encontrado",
    };
  }

  return {
    title: product.name,
    description: product.description || `${product.name} - $${product.price ?? 0}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - $${product.price ?? 0}`,
      type: "website",
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

  const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000"}/product/${id}`;

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
            <ProductImageGallery
              images={
                (product.product_images || [])
                  .slice()
                  .sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                  .map((img: any) => ({
                    id: String(img.id ?? ""),
                    url: img.image_url,
                  })) || []
              }
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

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

interface Props {
  params: {
    id: string;
  };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = params;
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
      product_categories(category_id, categories(id, name))
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
    description: product.description || `${product.name} - $${product.price}`,
    openGraph: {
      title: product.name,
      description: product.description || `${product.name} - $${product.price}`,
      type: "website",
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = params;
  const supabase = await createServerClient();

  const { data: product } = await supabase
    .from("products")
    .select(`
      id,
      name,
      description,
      price,
      available,
      categories: product_categories ( category_id, categories ( id, name ) ),
      product_images(id, image_url, display_order)
    `)
    .eq("id", id)
    .single();

  if (!product) {
    notFound();
  }

  // extraer categorias plano
  const cats = (product.categories || []).map((pc: any) => pc.categories).filter(Boolean) || [];

  const productUrl = `${process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000"}/product/${id}`;

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
                product.product_images
                  ?.sort((a: any, b: any) => (a.display_order || 0) - (b.display_order || 0))
                  .map((img: any) => ({
                    id: img.id,
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
                  <div className="flex gap-2 mb-2">
                    {cats.map((c: any) => (
                      <Badge key={c.id} className="bg-primary text-primary-foreground">
                        {c.name}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-baseline gap-3 py-4">
                <span className="text-5xl font-bold text-primary">${(product.price ?? 0).toFixed(2)}</span>
                {!product.available && (
                  <Badge variant="destructive" className="text-base py-1 px-3">
                    Agotado
                  </Badge>
                )}
              </div>

              <p className="text-sm text-muted-foreground font-medium">
                {product.available ? "Disponible" : "No disponible"}
              </p>
            </div>

            {product.description && (
              <div className="py-4 border-t border-border">
                <h2 className="text-lg font-semibold mb-3">Descripción</h2>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{product.description}</p>
              </div>
            )}

            <Card className="p-5 bg-muted/50 border-muted">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-secondary" />
                Información del Producto
              </h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between items-center">
                  <dt className="text-muted-foreground font-medium">Disponibilidad:</dt>
                  <dd className="font-semibold text-foreground">{product.available ? "Disponible" : "No disponible"}</dd>
                </div>
              </dl>
            </Card>

            <ProductShareButtons productUrl={productUrl} productName={product.name} productPrice={product.price} />
          </div>
        </div>
      </main>
    </div>
  );
}

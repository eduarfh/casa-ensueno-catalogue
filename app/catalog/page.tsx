// app/catalog/page.tsx
import React from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CatalogFilters from "@/components/catalog-filters";
import { createPublicServerClient } from "@/lib/supabase/server";
import SiteHeader from "@/components/site-header";
import type { Product } from "@/lib/products";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { category?: string; search?: string };
}) {
  const params = searchParams || {};
  const supabase = createPublicServerClient();

  // Fetch categories: seleccionamos id_int (entero) y name
  const { data: categories } = await supabase
    .from("categories")
    .select("id_int, name")
    .order("name");

  // Build products query - incluir product_categories relation para mostrar categorías
  let query: any = supabase
    .from("products")
    .select(`
      id,
      name,
      price,
      available,
      product_images(image_url),
      product_categories(category_id, categories(id, name))
    `)
    .order("created_at", { ascending: false });

  // Filter only available products by default
  query = query.eq("available", true);

  // Apply category filter (ahora product_categories.category_id es integer)
  if (params.category) {
    const catId = Number(params.category);
    if (!Number.isNaN(catId)) {
      query = query.eq("product_categories.category_id", catId);
    }
    // si no es número, se ignora (evita 400 por UUID inválido)
  }

  // Apply search filter
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data: products } = await query;

  // Transformación ligera para enviar al cliente (serializable)
  const productsForClient: Product[] = (products || []).map((p: any) => {
    const cats = Array.isArray(p.product_categories)
      ? p.product_categories.map((pc: any) => pc.categories?.name).filter(Boolean)
      : [];

    return {
      id: p.id,
      name: p.name,
      price: p.price,
      available: p.available,
      image: p.product_images && p.product_images[0]?.image_url ? p.product_images[0].image_url : null,
      // usamos la primera categoría para el color/label; si no hay, "Sin categoría"
      category: cats.length > 0 ? cats[0] : "Sin categoría",
    };
  });

  // Mapear categories para frontend: convertir id_int a string (para la URL)
  const categoriesForClient = (categories || []).map((c: any) => ({
    id: String(c.id_int),
    name: c.name,
  }));

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Descubre nuestra selección completa de artículos para tu hogar
          </p>

          {/* CatalogFilters es cliente; le pasamos categories (con id_int) y productsForClient */}
          <div className="mb-4">
            <CatalogFilters
              categories={categoriesForClient}
              currentSearch={params.search}
              currentCategory={params.category}
              products={productsForClient}
            />
          </div>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product: any) => {
              const cats = product.product_categories?.map((pc: any) => pc.categories).filter(Boolean) || [];
              return (
                <ProductCard
                  key={product.id}
                  id={product.id}
                  name={product.name}
                  price={product.price}
                  image={product.product_images && product.product_images[0]?.image_url}
                  available={product.available}
                  categories={cats}
                />
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center min-h-96 px-4">
            <p className="text-base sm:text-lg text-muted-foreground mb-4 text-center">
              No hay productos que coincidan con tu búsqueda
            </p>
            <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Link href="/catalog">Ver todos los productos</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}

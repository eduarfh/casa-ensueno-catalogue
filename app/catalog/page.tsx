// app/catalog/page.tsx
import React, { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { CatalogFilters } from "@/components/catalog-filters";
import { createPublicServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams?: { category?: string; search?: string };
}) {
  const params = searchParams || {};
  const supabase = createPublicServerClient();

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  // Build products query
  let query: any = supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      available,
      stock,
      category_id,
      product_images(image_url)
    `,
    )
    .eq("available", true)
    .order("created_at", { ascending: false });

  // Apply category filter
  if (params.category) {
    query = query.eq("category_id", params.category);
  }

  // Apply search filter
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const { data: products } = await query;

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4 flex items-center justify-between gap-4">
          <Link href="/" className="text-xl sm:text-2xl font-bold text-primary hover:text-primary/80 transition-colors">
            Casa Ensueño • Store
          </Link>
          <nav className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/catalog"
              className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
            >
              Catálogo
            </Link>
            <Link
              href="/auth/login"
              className="text-xs sm:text-sm font-medium hover:text-primary transition-colors px-2 py-1"
            >
              Admin
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-sm sm:text-base text-muted-foreground mb-4 sm:mb-6">
            Descubre nuestra selección completa de artículos para tu hogar
          </p>

          {/* Envuelve el componente cliente en Suspense para evitar el error de useSearchParams */}
          <Suspense fallback={<div className="mb-4 text-sm text-muted-foreground">Cargando filtros…</div>}>
            {/* Si CatalogFilters usa useSearchParams internamente, estará contento dentro de Suspense */}
            <CatalogFilters
              categories={categories || []}
              currentSearch={params.search}
              currentCategory={params.category}
            />
          </Suspense>
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product: any) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                image={product.product_images && product.product_images[0]?.image_url}
                available={product.available}
                stock={product.stock}
              />
            ))}
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

// app/catalog/page.tsx

import { createClient } from "@/lib/supabase/server"
import { ProductCard } from "@/components/product-card"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { CatalogFilters } from "@/components/catalog-filters"

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>
}) {
  const params = await searchParams
  const supabase = await createClient()

  // Fetch categories
  const { data: categories } = await supabase.from("categories").select("id, name").order("name")

  // Build products query
  let query = supabase
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
    .order("created_at", { ascending: false })

  // Apply category filter
  if (params.category) {
    query = query.eq("category_id", params.category)
  }

  // Apply search filter
  if (params.search) {
    query = query.ilike("name", `%${params.search}%`)
  }

  const { data: products } = await query

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="text-2xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent"
          >
            HomeDecor
          </Link>
          <nav className="flex items-center gap-4">
            <Link href="/catalog" className="text-sm font-medium hover:text-primary transition-colors">
              Catálogo
            </Link>
            <Link href="/auth/login" className="text-sm font-medium hover:text-primary transition-colors">
              Admin
            </Link>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Catálogo de Productos</h1>
          <p className="text-muted-foreground mb-6">Descubre nuestra selección completa de artículos para tu hogar</p>
          <CatalogFilters
            categories={categories || []}
            currentSearch={params.search}
            currentCategory={params.category}
          />
        </div>

        {products && products.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map((product) => (
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
          <div className="flex flex-col items-center justify-center min-h-96">
            <p className="text-lg text-muted-foreground mb-4">No hay productos que coincidan con tu búsqueda</p>
            <Button asChild className="bg-primary hover:bg-primary/90">
              <Link href="/catalog">Ver todos los productos</Link>
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}

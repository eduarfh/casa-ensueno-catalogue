// app/catalog/page.tsx
import React, { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import CatalogFilters from "@/components/catalog-filters";
import { createServerClient } from "@/lib/supabase/server";
import { ThemeToggle } from "@/components/theme-toggle";
import CatalogClient from "@/components/catalog-client";
import SiteHeader from "@/components/site-header";

export default async function CatalogPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createServerClient();

  // Fetch categories (para filtros) - traemos id_int además de id para poder mapear uuid <-> int
  const { data: categoriesRaw } = await supabase
    .from("categories")
    .select("id, id_int, name")
    .order("name");

  // Build maps both ways: uuid -> int, int -> uuid
  const uuidToInt = new Map<string, number>();
  const intToUuid = new Map<number, string>();
  (categoriesRaw || []).forEach((c: any) => {
    const uuid = c?.id ? String(c.id) : null;
    const idInt = typeof c?.id_int === "number" ? c.id_int : Number(c?.id_int);
    if (uuid) {
      if (!Number.isNaN(idInt)) {
        uuidToInt.set(uuid, idInt);
        intToUuid.set(idInt, uuid);
      } else {
        // categoria sin id_int útil: aún guardamos uuid->NaN si quieres
        uuidToInt.set(uuid, NaN);
      }
    }
  });

  // Helpers
  const isValidUUID = (s?: string) =>
    !!s && /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-5][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}$/.test(s);

  const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

  // Build products query (server side filtering)
  let query = supabase
    .from("products")
    .select(
      `
      id,
      name,
      price,
      available,
      product_images(image_url),
      product_categories(category_id)
    `
    )
    .eq("available", true)
    .order("created_at", { ascending: false });

  if (params.category) {
    const raw = String(params.category).trim();

    // If it's an integer-like string -> resolve to uuid via intToUuid
    const maybeNum = Number(raw);
    let catFilterUuid: string | null = null;

    if (!Number.isNaN(maybeNum) && Number.isInteger(maybeNum)) {
      // buscar uuid para ese id_int
      const resolved = intToUuid.get(maybeNum);
      if (resolved) {
        catFilterUuid = resolved;
      } else {
        // no existe esa id_int en categories -> forzar match 0 filas con ZERO_UUID
        catFilterUuid = ZERO_UUID;
      }
    } else if (isValidUUID(raw)) {
      // Si el param ya es un uuid válido, úsalo tal cual
      catFilterUuid = raw;
    } else {
      // ni número ni uuid válido -> no match
      catFilterUuid = ZERO_UUID;
    }

    // Filtramos por la columna UUID (product_categories.category_id)
    query = query.eq("product_categories.category_id", catFilterUuid);
  }

  if (params.search) {
    query = query.ilike("name", `%${params.search}%`);
  }

  const productsResult = await query;
  const productsRaw = productsResult.data;
  const productsError = productsResult.error;

  if (productsError) {
    return (
      <div className="min-h-screen bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 py-6">
          <h1 className="text-2xl font-bold mb-4">Error consultando productos</h1>
          <pre className="whitespace-pre-wrap bg-red-50 p-4 rounded">
            {JSON.stringify(productsError, null, 2)}
          </pre>
          <p className="mt-4">Intenta ejecutar la misma consulta en el SQL editor de Supabase.</p>
        </main>
      </div>
    );
  }

  // Normalizar datos para enviar al cliente (garantizar tipos)
  const products = (productsRaw || []).map((p: any) => ({
    id: p.id,
    name: p.name,
    price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
    available: !!p.available,
    images: (p.product_images || []).map((img: any) => img?.image_url).filter(Boolean) || [],
    category:
      p.product_categories && p.product_categories.length > 0
        ? String(p.product_categories[0].category_id)
        : null,
  }));

  // Mapear categoriesRaw a categories para pasarlo a CatalogFilters/CatalogClient
  const categories = (categoriesRaw || []).map((c: any) => ({
    // preferimos id_int (si existe) porque a la UI probablemente le sea más cómodo mostrar enteros
    id: String((c as any).id_int ?? (c as any).id ?? ""),
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

          {/* Filters (componente de servidor/cliente — lo mantengo igual) */}
          <CatalogFilters
            categories={categories || []}
            currentSearch={params.search}
            currentCategory={params.category}
          />
        </div>

        {/* Usamos un componente cliente para la lista, sin useSearchParams */}
        {products && products.length > 0 ? (
          <Suspense fallback={<div>Loading products…</div>}>
            <CatalogClient products={products} categories={categories} />
          </Suspense>
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

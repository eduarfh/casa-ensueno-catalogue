// components/catalog-client.tsx
"use client";
import React from "react";
import { ProductCard } from "@/components/product-card";

interface Category {
  id: string;
  name: string;
}

interface Product {
  id: string;
  name: string;
  price?: number | null;
  available?: boolean | null;
  stock?: number | undefined;
  images?: string[] | null;
  category_id?: string | number | null;
  category?: string | number | null;
}

interface Props {
  products: Product[];
  categories: Category[];
}

/**
 * Componente cliente para listar productos.
 * NOTA: la UI de filtros se gestiona desde app/catalog/page.tsx (CatalogFilters),
 * por eso aquí sólo mostramos la grid de productos.
 */
export default function CatalogClient({ products, categories }: Props) {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.length === 0 ? (
          <div className="text-muted-foreground col-span-full">No se encontraron productos.</div>
        ) : (
          products.map((p) => {
            // Normalizaciones sencillas (igual que antes)
            const price = typeof p.price === "number" ? p.price : Number(p.price ?? 0);
            const imgs = p.images && p.images.length > 0 ? p.images : undefined;
            const available = typeof p.available === "boolean" ? p.available : true;

            // Si necesitas mostrar categorías en la tarjeta y no tienes la relación directa,
            // mantén la lógica que extraiga la categoría desde category/category_id (si aplica).
            // Aquí pasamos `categories` si ProductCard necesita resolverlas (si lo hace).
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                images={imgs}
                available={available}
                // Si usas productCategoriesFor antes, puedes reimplementarla si hace falta.
                // categories prop en ProductCard es opcional en tu implementación actual.
              />
            );
          })
        )}
      </div>
    </section>
  );
}

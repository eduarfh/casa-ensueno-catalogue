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
  images?: string[] | null;
  category_id?: string | number | null;
  category?: string | number | null;
}

interface Props {
  products: Product[];
  categories?: Category[];
}

export default function CatalogClient({ products, categories = [] }: Props) {
  return (
    <section>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
        {products.length === 0 ? (
          <div className="text-muted-foreground col-span-full">No se encontraron productos.</div>
        ) : (
          products.map((p) => {
            const price = typeof p.price === "number" ? p.price : Number(p.price ?? 0);
            const imgs = p.images && p.images.length > 0 ? p.images : undefined;
            const available = typeof p.available === "boolean" ? p.available : true;

            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={price}
                images={imgs}
                available={available}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

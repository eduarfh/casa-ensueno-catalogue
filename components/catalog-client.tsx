// components/catalog-client.tsx
"use client";
import React from "react";
import ProductCard from "@/components/product-card";

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
  category?: string | null;
}

interface Props {
  products: Product[];
  categories?: Category[];
}

export default function CatalogClient({ products, categories = [] }: Props) {
  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.length === 0 ? (
          <div className="text-muted-foreground col-span-full">No se encontraron productos.</div>
        ) : (
          products.map((p) => (
            <ProductCard
              key={p.id}
              id={p.id}
              name={p.name}
              price={p.price}
              images={p.images}
              available={p.available ?? true}
            />
          ))
        )}
      </div>
    </section>
  );
}

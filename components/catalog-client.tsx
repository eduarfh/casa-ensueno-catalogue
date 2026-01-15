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
  categories?: (string | { id?: string; name?: string; uuid?: string; id_int?: number })[] | null;
}

interface Props {
  products: Product[];
  categories?: Category[]; // opcional: lista de categorías que el server provee (id,name)
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function CatalogClient({ products, categories = [] }: Props) {
  const idToName = React.useMemo(() => {
    const m = new Map<string, string>();
    categories.forEach((c) => m.set(String(c.id), c.name));
    return m;
  }, [JSON.stringify(categories)]);

  const resolveCategory = (candidate: any): { name: string | null; seed: string | null } => {
    if (candidate == null) return { name: null, seed: null };
    if (typeof candidate === "object") {
      const name = candidate.name ?? candidate.title ?? null;
      if (candidate.id && typeof candidate.id === "string" && uuidRegex.test(candidate.id)) {
        return { name: name ?? idToName.get(candidate.id) ?? candidate.id, seed: idToName.get(candidate.id) ? candidate.id : candidate.id };
      }
      if (candidate.id) {
        const s = String(candidate.id);
        return { name: name ?? idToName.get(s) ?? s, seed: idToName.get(s) ? s : s };
      }
      return { name, seed: name ?? null };
    }

    const s = String(candidate).trim();
    if (!s) return { name: null, seed: null };
    if (uuidRegex.test(s)) {
      return { name: idToName.get(s) ?? s, seed: idToName.get(s) ? s : s };
    }
    if (/^\d+$/.test(s)) {
      return { name: idToName.get(s) ?? s, seed: idToName.get(s) ? s : s };
    }
    return { name: s, seed: s };
  };

  return (
    <section>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
        {products.length === 0 ? (
          <div className="text-muted-foreground col-span-full">No se encontraron productos.</div>
        ) : (
          products.map((p) => {
            const first = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0] : p.category ?? null;
            const resolved = resolveCategory(first);
            return (
              <ProductCard
                key={p.id}
                id={p.id}
                name={p.name}
                price={p.price}
                images={p.images}
                available={p.available ?? true}
                category={resolved.name}
                categorySeed={resolved.seed}
                categories={p.categories as any}
              />
            );
          })
        )}
      </div>
    </section>
  );
}

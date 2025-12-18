// components/catalog-shell.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CategoryFilter from "@/components/category-filter";
import ProductCard from "@/components/product-card";
import { Button } from "@/components/ui/button";

interface Category {
  uuid: string; // UUID from DB
  id_int: number | null; // optional numeric id
  id: string; // id used in UI (prefer id_int)
  name: string;
}

export default function CatalogShell({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = searchParams?.get("category") ?? null;
  const initialSearch = searchParams?.get("search") ?? "";

  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // build a uuid -> { id, name } map for grouping + display
  const uuidToCategory = React.useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    categories.forEach((c) => {
      m.set(String(c.uuid), { id: c.id, name: c.name });
    });
    return m;
  }, [JSON.stringify(categories)]);

  const pushUrl = (cat: string | null, search: string) => {
    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (cat && String(cat).trim() !== "") params.set("category", String(cat));
    const q = params.toString();
    // use replace to avoid full nav
    router.replace(`${pathname}${q ? `?${q}` : ""}`);
  };

  const doFetch = async (cat: string | null, search: string) => {
    setLoading(true);
    setError(null);
    if (controllerRef.current) controllerRef.current.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (cat && String(cat).trim() !== "") params.set("category", String(cat));
    const url = `/api/products/search?${params.toString()}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      setProducts(json.products ?? []);
    } catch (err: any) {
      if (err.name === "AbortError") return;
      console.error("[CatalogShell] fetch error:", err);
      setError(err.message ?? "Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      pushUrl(selectedCategory, searchTerm);
      doFetch(selectedCategory, searchTerm);
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCategory, searchTerm]);

  useEffect(() => {
    doFetch(selectedCategory, searchTerm);
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onSelectCategory = (catId: string | null) => setSelectedCategory(catId);

  const onClear = () => {
    setSelectedCategory(null);
    setSearchTerm("");
    pushUrl(null, "");
    doFetch(null, "");
  };

  // Grouping: if no category filter, group products by product.category (uuid)
  const grouped = React.useMemo(() => {
    if (selectedCategory) {
      // when filtered, just return a single group with filtered products
      return [{ title: null, key: "filtered", items: products }];
    }
    // group by category uuid (product.category may be uuid or null)
    const map = new Map<string, any[]>();
    products.forEach((p) => {
      const key = p.category ?? "uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    });

    // Build groups sorted by category name (categories present first), then uncategorized last
    const groups: { key: string; title: string | null; items: any[] }[] = [];

    // categories that exist in the map and in uuidToCategory: use category name
    for (const [uuid, { name }] of Array.from(uuidToCategory.entries())) {
      if (map.has(uuid)) {
        groups.push({ key: uuid, title: name, items: map.get(uuid)! });
        map.delete(uuid);
      }
    }

    // remaining keys (maybe numeric id_ints or UUIDs unknown), add them with raw key
    for (const [key, items] of Array.from(map.entries())) {
      if (key === "uncategorized") {
        groups.push({ key, title: "Sin categoría", items });
      } else {
        groups.push({ key, title: null, items });
      }
    }

    return groups;
  }, [selectedCategory, products, uuidToCategory]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (debounceRef.current) window.clearTimeout(debounceRef.current);
          pushUrl(selectedCategory, searchTerm);
          doFetch(selectedCategory, searchTerm);
        }}
        className="flex gap-2 items-center mb-4"
      >
        <input
          type="search"
          placeholder="Buscar productos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-1 rounded-md border px-3 py-2 outline-none focus:ring focus:ring-opacity-60"
          aria-label="Buscar productos"
        />
        <Button type="submit" className="shrink-0">
          Buscar
        </Button>
        <Button type="button" variant="ghost" onClick={onClear}>
          Limpiar
        </Button>
      </form>

      <CategoryFilter
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        products={[]}
      />

      <div className="mt-6 space-y-8">
        {loading ? (
          <div className="text-muted-foreground">Cargando productos...</div>
        ) : error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : products.length === 0 ? (
          <div className="text-muted-foreground">No se encontraron productos.</div>
        ) : (
          grouped.map((g) => (
            <section key={g.key}>
              {g.title ? (
                <h2 className="text-lg font-semibold mb-3">{g.title}</h2>
              ) : selectedCategory ? null : (
                // show a subtle label for unnamed groups when not filtered
                <h3 className="text-sm text-muted-foreground mb-2">Otros</h3>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {g.items.map((p: any) => (
                  <ProductCard
                    key={p.id}
                    id={p.id}
                    name={p.name}
                    price={p.price}
                    images={p.images}
                    available={p.available}
                  />
                ))}
              </div>
            </section>
          ))
        )}
      </div>
    </div>
  );
}

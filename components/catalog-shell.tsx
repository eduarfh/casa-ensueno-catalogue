"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CategoryFilter from "@/components/category-filter";
import ProductCard from "@/components/product-card";
import SearchBar from "./search-bar";
import AvailabilityToggle from "@/components/availability-toggle";
import SkeletonGrid from "@/components/skeleton-grid";

interface Category {
  uuid: string;
  id_int: number | null;
  id: string; // aquí page.tsx asigna String(id_int ?? id)
  name: string;
}

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default function CatalogShell({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const initialCategory = searchParams?.get("category") ?? null;
  const initialSearch = searchParams?.get("search") ?? "";
  const initialAvailableParam = searchParams?.get("available") ?? null;

  const mapParamToFilter = (p: string | null) => {
    if (!p) return "available" as const;
    if (p === "1" || p.toLowerCase() === "true") return "available" as const;
    return "all" as const;
  };

  const [searchTerm, setSearchTerm] = useState<string>(initialSearch);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(initialCategory);
  const [availableFilter, setAvailableFilter] = useState<"all" | "available">(mapParamToFilter(initialAvailableParam));
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const debounceRef = useRef<number | null>(null);
  const controllerRef = useRef<AbortController | null>(null);

  // mapa uuid -> { id (el id usado por el filtro), name }
  const uuidToCategory = React.useMemo(() => {
    const m = new Map<string, { id: string; name: string }>();
    (categories || []).forEach((c) => {
      m.set(String(c.uuid), { id: c.id, name: c.name });
    });
    return m;
  }, [JSON.stringify(categories)]);

  const pushUrl = (cat: string | null, search: string, available: "all" | "available") => {
    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (cat && String(cat).trim() !== "") params.set("category", String(cat));
    if (available === "available") params.set("available", "1");
    const q = params.toString();
    router.replace(`${pathname}${q ? `?${q}` : ""}`);
  };

  const doFetch = async (cat: string | null, search: string, available: "all" | "available") => {
    setLoading(true);
    setError(null);

    if (controllerRef.current) {
      controllerRef.current.abort();
    }
    const controller = new AbortController();
    controllerRef.current = controller;

    const params = new URLSearchParams();
    if (search && search.trim() !== "") params.set("search", search.trim());
    if (cat && String(cat).trim() !== "") params.set("category", String(cat));
    if (available === "available") params.set("available", "1");

    const url = `/api/products/search?${params.toString()}`;

    try {
      const res = await fetch(url, { signal: controller.signal });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        throw new Error(json?.error ?? `HTTP ${res.status}`);
      }
      const json = await res.json();
      let items = json.products ?? [];

      if (available === "available") {
        items = items.filter((p: any) => p.available === true || p.available === 1 || p.available === "1");
      }

      setProducts(items);
      setError(null);
    } catch (err: any) {
      if (err.name === "AbortError") {
        return;
      }
      console.error("[CatalogShell] fetch error:", err);
      setError(err.message ?? "Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    debounceRef.current = window.setTimeout(() => {
      pushUrl(selectedCategory, searchTerm, availableFilter);
      doFetch(selectedCategory, searchTerm, availableFilter);
      debounceRef.current = null;
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [selectedCategory, searchTerm, availableFilter]);

  useEffect(() => {
    doFetch(selectedCategory, searchTerm, availableFilter);
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const safeAbortAndSetLoading = () => {
    if (debounceRef.current) {
      window.clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    if (controllerRef.current) {
      try {
        controllerRef.current.abort();
      } catch {}
      controllerRef.current = null;
    }
    setLoading(true);
  };

  const onSelectCategory = (cat: string | null) => {
    safeAbortAndSetLoading();
    setSelectedCategory(cat);
  };

  const onSearchChange = (v: string) => {
    safeAbortAndSetLoading();
    setSearchTerm(v);
  };

  const onAvailableChange = (v: "all" | "available") => {
    safeAbortAndSetLoading();
    setAvailableFilter(v);
  };

  const onClear = () => {
    safeAbortAndSetLoading();
    setSelectedCategory(null);
    setSearchTerm("");
    setAvailableFilter("available");
    pushUrl(null, "", "available");
    doFetch(null, "", "available");
  };

  // RESOLVER que devuelve { name, seed } donde seed es la misma clave que usa el filtro
  const resolveCategory = (candidate: any): { name: string | null; seed: string | null } => {
    if (candidate === null || candidate === undefined) return { name: null, seed: null };

    // si candidate ya es objeto con name y posiblemente id/uuid
    if (typeof candidate === "object") {
      const name = candidate.name ?? candidate.title ?? null;

      // intentar obtener seed en el mismo formato que CategoryFilter usa (page.tsx -> id = id_int ?? id)
      // prioridad: si tiene uuid -> buscar en uuidToCategory para obtener su id (el id que usa filtro)
      if (candidate.id && typeof candidate.id === "string" && uuidRegex.test(candidate.id)) {
        const found = uuidToCategory.get(candidate.id);
        return { name: name ?? (found?.name ?? candidate.id), seed: found?.id ?? candidate.id };
      }

      if (candidate.uuid && typeof candidate.uuid === "string") {
        const found = uuidToCategory.get(candidate.uuid);
        return { name: name ?? (found?.name ?? candidate.uuid), seed: found?.id ?? candidate.uuid };
      }

      // si tiene id que no es uuid (podría ser id_int)
      if (candidate.id) {
        const s = String(candidate.id);
        // buscar en categories
        const found2 = (categories || []).find((c) => String(c.id) === s || String(c.id_int) === s || String(c.uuid) === s);
        if (found2) return { name: name ?? found2.name, seed: found2.id };
        return { name: name ?? s, seed: s };
      }

      return { name, seed: name ?? null };
    }

    // candidate es string / number
    const s = String(candidate).trim();
    if (!s) return { name: null, seed: null };

    if (uuidRegex.test(s)) {
      const found = uuidToCategory.get(s);
      return { name: found?.name ?? s, seed: found?.id ?? s };
    }

    if (/^\d+$/.test(s)) {
      // buscar en categories por id (page.tsx mapea id = id_int ?? id)
      const found = (categories || []).find((c) => String(c.id) === s || String(c.id_int) === s);
      if (found) return { name: found.name, seed: found.id };
      return { name: s, seed: s };
    }

    // si no es uuid ni numérico, lo tratamos como nombre
    return { name: s, seed: s };
  };

  const grouped = React.useMemo(() => {
    if (selectedCategory) {
      return [{ title: null, key: "filtered", items: products }];
    }

    const map = new Map<string, any[]>();
    const getPrimaryCategoryKey = (p: any) => {
      if (Array.isArray(p.categories) && p.categories.length > 0) {
        const first = p.categories[0];
        if (first == null) return null;
        if (typeof first === "string") return String(first);
        if (typeof first === "object") return String(first.id ?? first.uuid ?? first.name ?? first.title ?? first);
      }
      if (p.category) return String(p.category);
      return null;
    };

    products.forEach((p) => {
      const key = getPrimaryCategoryKey(p) ?? "uncategorized";
      const arr = map.get(key) ?? [];
      arr.push(p);
      map.set(key, arr);
    });

    const groups: { key: string; title: string | null; items: any[] }[] = [];

    for (const [uuid, { name }] of Array.from(uuidToCategory.entries())) {
      if (map.has(uuid)) {
        groups.push({ key: uuid, title: name, items: map.get(uuid)! });
        map.delete(uuid);
      }
    }

    for (const [key, items] of Array.from(map.entries())) {
      if (key === "uncategorized") {
        groups.push({ key, title: "Sin categoría", items });
      } else {
        groups.push({ key, title: null, items });
      }
    }

    return groups;
  }, [selectedCategory, products, uuidToCategory, categories]);

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="flex gap-3 items-center mb-4"
      >
        <div className="flex-1">
          <SearchBar value={searchTerm} onChange={(v) => onSearchChange(v)} placeholder="Buscar productos..." className="w-full" />
        </div>

        <div className="flex-none ml-2">
          <AvailabilityToggle value={availableFilter} onChange={(v) => onAvailableChange(v)} />
        </div>
      </form>

      <CategoryFilter
        categories={categories.map((c) => ({ id: c.id, name: c.name }))}
        selectedCategory={selectedCategory}
        onSelectCategory={onSelectCategory}
        products={[]}
      />

      <div className="mt-6 space-y-8">
        {error ? (
          <div className="text-red-600">Error: {error}</div>
        ) : (
          <div className="relative">
            {loading && products.length === 0 ? (
              <SkeletonGrid columns={4} count={8} />
            ) : (
              grouped.map((g) => (
                <section key={g.key}>
                  {g.title ? <h2 className="text-lg font-semibold mb-3">{g.title}</h2> : selectedCategory ? null : <h3 className="text-sm text-muted-foreground mb-2">Otros</h3>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoRows: "1fr" }}>
                    {g.items.map((p: any) => {
                      // calculamos name + seed para pasar al ProductCard
                      const firstCat = Array.isArray(p.categories) && p.categories.length > 0 ? p.categories[0] : p.category ?? null;
                      const resolved = resolveCategory(firstCat);

                      return (
                        <ProductCard
                          key={p.id}
                          id={p.id}
                          name={p.name}
                          price={p.price}
                          images={p.images}
                          available={p.available}
                          // pasamos nombre legible y seed (seed coincide con lo que usa CategoryFilter)
                          category={resolved.name}
                          categorySeed={resolved.seed}
                          // mantengo raw categories por compatibilidad
                          categories={p.categories}
                        />
                      );
                    })}
                  </div>
                </section>
              ))
            )}

            {loading && products.length > 0 && (
              <div
                className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/30 backdrop-blur-sm pointer-events-none"
                role="status"
                aria-live="polite"
                aria-hidden={false}
              >
                <div className="animate-pulse px-4 py-2 rounded-md bg-white/80 dark:bg-gray-800/70 text-sm shadow">
                  Actualizando...
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

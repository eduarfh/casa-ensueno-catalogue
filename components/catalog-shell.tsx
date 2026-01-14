// components/catalog-shell.tsx
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
  id: string;
  name: string;
}

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
    // doFetch gestiona su propio loading -> importante dejarlo
    setLoading(true);
    setError(null);

    // abort previous controller (should already be aborted by handlers, pero por si)
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

      // Aplicamos filtrado local por disponibilidad si backend no soporta available
      if (available === "available") {
        items = items.filter((p: any) => p.available === true || p.available === 1 || p.available === "1");
      }

      setProducts(items);
      setError(null);
    } catch (err: any) {
      if (err.name === "AbortError") {
        // petición abortada: no consideramos error
        return;
      }
      console.error("[CatalogShell] fetch error:", err);
      setError(err.message ?? "Error fetching products");
      setProducts([]);
    } finally {
      setLoading(false);
      // liberar controllerRef si era el actual
      if (controllerRef.current === controller) controllerRef.current = null;
    }
  };

  // debounce + pushUrl: centralizamos el debounce aquí (se reactiva al cambiar selectedCategory/searchTerm/availableFilter)
  useEffect(() => {
    // limpiar debounce previo
    if (debounceRef.current) window.clearTimeout(debounceRef.current);

    // arrancamos un nuevo debounce
    debounceRef.current = window.setTimeout(() => {
      pushUrl(selectedCategory, searchTerm, availableFilter);
      doFetch(selectedCategory, searchTerm, availableFilter);
      debounceRef.current = null;
    }, 300);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
    // deliberately watch these three params
  }, [selectedCategory, searchTerm, availableFilter]);

  // inicial: fetch una vez al montar (si quieres forzar skeleton)
  useEffect(() => {
    doFetch(selectedCategory, searchTerm, availableFilter);
    return () => {
      if (controllerRef.current) controllerRef.current.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // HANDLERS (mejor experiencia: activar loading inmediatamente y abortar fetchs previos)
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
    // activamos overlay inmediatamente para evitar ver la lista "mezclada"
    setLoading(true);
  };

  const onSelectCategory = (cat: string | null) => {
    safeAbortAndSetLoading();
    setSelectedCategory(cat);
    // la useEffect que escucha selectedCategory se encargará de reiniciar el debounce/doFetch
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
    // cancelar cualquier petición y mostrar loading hasta que doFetch responda
    safeAbortAndSetLoading();
    setSelectedCategory(null);
    setSearchTerm("");
    setAvailableFilter("available");
    pushUrl(null, "", "available");
    // lanza fetch inmediato (sin esperar al debounce) para respuesta rápida al clear
    doFetch(null, "", "available");
  };

  const grouped = React.useMemo(() => {
    // Si hay un filtro aplicado, devolvemos el grupo "filtered" con los items actuales.
    // Nota: ahora, al cambiar un filtro, `loading` se activa inmediatamente por los handlers,
    // y el overlay cubrirá la lista previa hasta que la nueva petición reemplace `products`.
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
  }, [selectedCategory, products, uuidToCategory]);

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
            {/* Si no hay productos previos y estamos cargando, mostramos skeletons */}
            {loading && products.length === 0 ? (
              <SkeletonGrid columns={4} count={8} />
            ) : (
              grouped.map((g) => (
                <section key={g.key}>
                  {g.title ? <h2 className="text-lg font-semibold mb-3">{g.title}</h2> : selectedCategory ? null : <h3 className="text-sm text-muted-foreground mb-2">Otros</h3>}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6" style={{ gridAutoRows: "1fr" }}>
                    {g.items.map((p: any) => (
                      <ProductCard key={p.id} id={p.id} name={p.name} price={p.price} images={p.images} available={p.available} />
                    ))}
                  </div>
                </section>
              ))
            )}

            {/* overlay sutil si hay items previos y estamos recargando */}
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

// components/catalog-shell.tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import CategoryFilter from "@/components/category-filter";
import ProductCard from "@/components/product-card";
import SearchBar from "./search-bar";
import AvailabilityToggle from "@/components/availability-toggle";

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
    const initialAvailableParam = searchParams?.get("available") ?? null; // "1" | null

    // Ahora por defecto es "available" si no hay param
    const mapParamToFilter = (p: string | null) => {
      if (!p) return "available" as const; // default -> available
      if (p === "1" || p.toLowerCase() === "true") return "available" as const;
      return "all" as const;
    }

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
        categories.forEach((c) => {
            m.set(String(c.uuid), { id: c.id, name: c.name });
        });
        return m;
    }, [JSON.stringify(categories)]);

    const pushUrl = (cat: string | null, search: string, available: "all" | "available") => {
        const params = new URLSearchParams();
        if (search && search.trim() !== "") params.set("search", search.trim());
        if (cat && String(cat).trim() !== "") params.set("category", String(cat));
        // SOLO incluimos available si está en 'available'
        if (available === "available") params.set("available", "1");
        const q = params.toString();
        router.replace(`${pathname}${q ? `?${q}` : ""}`);
    };

    const doFetch = async (cat: string | null, search: string, available: "all" | "available") => {
        setLoading(true);
        setError(null);
        if (controllerRef.current) controllerRef.current.abort();
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
        } catch (err: any) {
            if (err.name === "AbortError") return;
            console.error("[CatalogShell] fetch error:", err);
            setError(err.message ?? "Error fetching products");
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    // debounce + pushUrl
    useEffect(() => {
        if (debounceRef.current) window.clearTimeout(debounceRef.current);
        debounceRef.current = window.setTimeout(() => {
            pushUrl(selectedCategory, searchTerm, availableFilter);
            doFetch(selectedCategory, searchTerm, availableFilter);
        }, 300);

        return () => {
            if (debounceRef.current) window.clearTimeout(debounceRef.current);
        };
    }, [selectedCategory, searchTerm, availableFilter]);

    useEffect(() => {
        // llamada inicial (por defecto available si no hay param)
        doFetch(selectedCategory, searchTerm, availableFilter);
        return () => {
            if (controllerRef.current) controllerRef.current.abort();
        };
    }, []);

    const onSelectCategory = (catId: string | null) => setSelectedCategory(catId);

    const onClear = () => {
        setSelectedCategory(null);
        setSearchTerm("");
        setAvailableFilter("available"); // volver al default: available
        pushUrl(null, "", "available");
        doFetch(null, "", "available");
    };

    const grouped = React.useMemo(() => {
        if (selectedCategory) {
            return [{ title: null, key: "filtered", items: products }];
        }
        const map = new Map<string, any[]>();
        products.forEach((p) => {
            const key = p.category ?? "uncategorized";
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
                    e.preventDefault(); // evitamos submit — búsqueda reactiva onChange
                }}
                className="flex gap-3 items-center mb-4"
            >
                <div className="flex-1">
                  <SearchBar
                      value={searchTerm}
                      onChange={(v) => setSearchTerm(v)}
                      placeholder="Buscar productos..."
                      className="w-full"
                  />
                </div>

                {/* Botón único de disponibilidad (a la derecha de la búsqueda) */}
                <div className="flex-none ml-2">
                  <AvailabilityToggle value={availableFilter} onChange={(v) => setAvailableFilter(v)} />
                </div>
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
                                <h3 className="text-sm text-muted-foreground mb-2">Otros</h3>
                            )}

                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                                {g.items.map((p: any) => (
                                    <ProductCard
                                        key={p.id}
                                        id={p.id}
                                        name={p.name}
                                        price={p.price}
                                        images={p.images}
                                        available={p.available}
                                        categories={p.categories}
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

"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type { Product } from "@/lib/product";
import ProductCard from "@/components/product-card";
import CategoryFilter from "@/components/category-filter";
import SearchBar from "@/components/search-bar";
import AvailabilityFilter from "./availability-filter";
import CatalogLoading from "@/app/catalog/loading";

interface CatalogClientProps {
  products: Product[] | null | undefined;
}

type ListingState = {
  filters?: {
    category?: string | null;
    q?: string | null;
    available?: boolean | null;
  };
  scrollY?: number;
};

export default function CatalogClient({ products: serverProducts }: CatalogClientProps) {
  const router = useRouter();

  // filtros locales
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [availableOnly, setAvailableOnly] = useState<boolean>(true);

  // UI / control
  const [isLoading, setIsLoading] = useState<boolean>(
    !Array.isArray(serverProducts) || serverProducts.length === 0
  );

  // animación ligera al filtrar
  const [isFiltering, setIsFiltering] = useState(false);

  // refs para anim y debounce
  const rafRef = useRef<number | null>(null);
  const isAnimatingRef = useRef(false);
  const debounceRef = useRef<number | null>(null);

  // marcar primer render para no tratarlo como "filtrado" si quieres evitarlo
  const firstRenderRef = useRef(true);

  // ----------------- Scroll animation helpers (restauración) -----------------
  const easeOutQuad = (t: number) => 1 - (1 - t) * (1 - t);

  function animateScrollTo(targetY: number, duration = 350) {
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    const startY = window.scrollY;
    const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
    const boundedTarget = Math.min(Math.max(0, Math.round(targetY)), Math.max(0, Math.round(maxScroll)));
    const startTime = performance.now();

    function step(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(1, elapsed / duration);
      const eased = easeOutQuad(t);
      const newY = Math.round(startY + (boundedTarget - startY) * eased);
      window.scrollTo(0, newY);

      if (t < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        rafRef.current = null;
        isAnimatingRef.current = false;
      }
    }

    rafRef.current = requestAnimationFrame(step);
  }

  // ----------------- Persistencia: history.state + sessionStorage -----------------
  function saveListingState(scrollY?: number) {
    try {
      const state: ListingState = {
        filters: { category: selectedCategory, q: searchQuery, available: availableOnly },
        scrollY: typeof scrollY === "number" ? scrollY : typeof window !== "undefined" ? window.scrollY : 0,
      };
      history.replaceState({ ...(history.state || {}), listingState: state }, "");
      sessionStorage.setItem("catalogListingState", JSON.stringify(state));
    } catch (e) {
      console.error("Error saving listing state:", e);
    }
  }

  // Click -> guardar estado y navegar (sin animación hacia abajo)
  function navigateToProduct(id: string, name?: string) {
    // Evitar double clicks
    if (isAnimatingRef.current) return;
    isAnimatingRef.current = true;

    saveListingState();
    // Navegar en el siguiente frame
    requestAnimationFrame(() => {
      isAnimatingRef.current = false; // liberamos inmediatamente porque route takeover
      router.push(`/product/${encodeURIComponent(id)}`);
    });
  }

  function makeClickableProps(id: string, name?: string) {
    return {
      role: "link",
      tabIndex: 0,
      onClick: () => navigateToProduct(id, name),
      onKeyDown: (e: React.KeyboardEvent) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          navigateToProduct(id, name);
        }
      },
      className: "block cursor-pointer outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#95C7C3]/40",
      "aria-label": `Ver ${name ?? id}`,
    } as React.HTMLAttributes<HTMLElement>;
  }

  // ----------------- Restaurar filtros + scroll desde sessionStorage / history -----------------
  useEffect(() => {
    try {
      const hs = (history.state && (history.state as any).listingState) as ListingState | undefined;
      const ssRaw = typeof window !== "undefined" ? sessionStorage.getItem("catalogListingState") : null;
      const ss = ssRaw ? (JSON.parse(ssRaw) as ListingState) : undefined;
      const saved = hs ?? ss;

      if (saved && saved.filters) {
        if (typeof saved.filters.category !== "undefined") setSelectedCategory(saved.filters.category ?? null);
        if (typeof saved.filters.q !== "undefined") setSearchQuery(saved.filters.q ?? "");
        if (typeof saved.filters.available !== "undefined") setAvailableOnly(Boolean(saved.filters.available));
      } else {
        // fallback: intentar leer querystring
        const params = new URLSearchParams(window.location.search);
        const c = params.get("category");
        const q = params.get("q");
        const a = params.get("available");
        if (c) setSelectedCategory(c);
        if (q) setSearchQuery(q);
        if (a === "1") setAvailableOnly(true);
      }

      if (saved && typeof saved.scrollY === "number") {
        const savedScrollY = saved.scrollY;
        requestAnimationFrame(() => {
          const delta = Math.abs(window.scrollY - savedScrollY);
          if (delta < 4) {
            window.scrollTo(0, savedScrollY);
          } else {
            animateScrollTo(savedScrollY, 420);
          }
        });
      }
    } catch (e) {
      console.error("Error restoring catalog listing state:", e);
    }

    return () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Escuchar popstate (cuando el usuario retrocede desde /product/:id)
  useEffect(() => {
    function onPopState() {
      try {
        const hs = (history.state && (history.state as any).listingState) as ListingState | undefined;
        const ssRaw = typeof window !== "undefined" ? sessionStorage.getItem("catalogListingState") : null;
        const ss = ssRaw ? (JSON.parse(ssRaw) as ListingState) : undefined;
        const saved = hs ?? ss;

        if (saved && saved.filters) {
          if (typeof saved.filters.category !== "undefined") setSelectedCategory(saved.filters.category ?? null);
          if (typeof saved.filters.q !== "undefined") setSearchQuery(saved.filters.q ?? "");
          if (typeof saved.filters.available !== "undefined") setAvailableOnly(Boolean(saved.filters.available));
        }

        if (saved && typeof saved.scrollY === "number") {
          const savedScrollY = saved.scrollY;
          requestAnimationFrame(() => {
            animateScrollTo(savedScrollY, 420);
          });
        }
      } catch (e) {
        console.error("Error handling popstate for catalog:", e);
      } finally {
        isAnimatingRef.current = false;
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, []);

  // Mantener querystring en sync cuando cambian filtros (y guardar state)
  useEffect(() => {
    try {
      const listingState: ListingState = { filters: { category: selectedCategory, q: searchQuery, available: availableOnly } };
      const newState = { ...(history.state || {}), listingState };
      const params = new URLSearchParams();
      if (selectedCategory) params.set("category", selectedCategory);
      if (searchQuery) params.set("q", searchQuery);
      if (availableOnly) params.set("available", "1");
      const newUrl = params.toString() ? `${window.location.pathname}?${params.toString()}` : window.location.pathname;
      history.replaceState(newState, "", newUrl);
      sessionStorage.setItem("catalogListingState", JSON.stringify(listingState));
    } catch (e) {
      console.error("Error syncing filters to history:", e);
    }
  }, [selectedCategory, searchQuery, availableOnly]);

  // ----------------- Debounced filtering of products (client-side) -----------------
  const debouncedQuery = useMemo(() => searchQuery.trim().toLowerCase(), [searchQuery]);

  const filteredProducts = useMemo(() => {
    const base = Array.isArray(serverProducts) ? serverProducts : [];

    let result = base;

    if (debouncedQuery) {
      const q = debouncedQuery;
      result = result.filter((p) => {
        const name = (p.name ?? "") as string;
        // description puede que no exista en el tipo Product; accedemos de forma segura
        const desc = ((p as any).description ?? "") as string;
        const cat = (p.category ?? "") as string;
        return (
          String(name).toLowerCase().includes(q) ||
          String(desc).toLowerCase().includes(q) ||
          String(cat).toLowerCase().includes(q)
        );
      });
    }

    if (selectedCategory) {
      result = result.filter((p) => String(p.category) === String(selectedCategory));
    }

    if (availableOnly) {
      // p.available puede ser boolean | null | undefined; usamos Boolean(...)
      result = result.filter((p) => Boolean((p as any).available) === true);
    }

    return result;
  }, [serverProducts, debouncedQuery, selectedCategory, availableOnly]);

  // Trigger animation when filters change (skip first render)
  const filterKey = useMemo(() => `${selectedCategory ?? ""}||${debouncedQuery}||${availableOnly ? "1" : "0"}`, [selectedCategory, debouncedQuery, availableOnly]);

  useEffect(() => {
    if (firstRenderRef.current) {
      firstRenderRef.current = false;
      return; // skip animation on first mount (optional)
    }

    if (isLoading) return;

    // Respetar preferencia de reduce-motion
    const reduceMotion = typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    // Setear estado para que los items empiecen en 'hidden' y luego pasen a visible
    setIsFiltering(true);

    // small timeout to ensure DOM updated with opacity-0 before toggling to visible
    const t = window.setTimeout(() => setIsFiltering(false), 30);
    return () => window.clearTimeout(t);
  }, [filterKey, isLoading]);

  // Debounce search input to avoid heavy recalcs while typing (existing lightweight debounce)
  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      debounceRef.current = null;
    }, 200);

    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [searchQuery]);

  // If serverProducts is undefined/null -> treat as loading and show skeleton
  useEffect(() => {
    setIsLoading(!Array.isArray(serverProducts) || serverProducts.length === 0);
  }, [serverProducts]);

  // ----------------- Layout grouping by category (for mobile grouped view and desktop grouped view) -----------------
  const productsByCategory = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    filteredProducts.forEach((p) => {
      const key = (p.category ?? "Sin categoría") as string;
      if (!groups[key]) groups[key] = [];
      groups[key].push(p);
    });
    return groups;
  }, [filteredProducts]);

  // Obtener lista de categorías ordenadas alfabéticamente
  const sortedCategories = useMemo(() => {
    return Object.keys(productsByCategory).sort((a, b) =>
      a.localeCompare(b, "es", { sensitivity: "base" })
    );
  }, [productsByCategory]);

  // Helper para renderizar cada producto con animación ligera
  function renderProductArticle(product: Product, compact?: boolean) {
    const clickable = makeClickableProps(String(product.id), product.name);
    // combinar className existente con clases de animación
    const animClass = isFiltering ? "opacity-0 translate-y-2" : "opacity-100 translate-y-0";

    const combinedClass = `${(clickable.className ?? "").toString()} ${animClass} transition-all duration-300 ease-out motion-reduce:transition-none transform`;

    return (
      <article key={product.id} {...clickable} className={combinedClass}>
        <ProductCard
          id={product.id}
          name={product.name}
          price={(product as any).price}
          images={(product as any).images ?? []}
          available={Boolean((product as any).available)}
          category={product.category}
          {...(compact ? { compact: true } : {})}
        />
      </article>
    );
  }

  // ----------------- Render -----------------
  // Si no hay productos iniciales (servidor no envió productos) mostramos skeleton global
  if (!Array.isArray(serverProducts) || serverProducts.length === 0) {
    return <CatalogLoading />;
  }

  return (
    <main className="container mx-auto px-1 py-1">
      <div className="text-center mb-8">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4">Catálogo de Productos</h1>
        <p className="text-muted-foreground">Los mejores productos para tu casa de ensueño</p>
      </div>

      {/* Search + AvailableFilter */}
      <div className="mb-6 flex items-center gap-3">
        <div className="flex-1">
          <SearchBar value={searchQuery} onChange={setSearchQuery} placeholder="Buscar..." />
        </div>
        <div className="flex-shrink-0">
          <AvailabilityFilter active={availableOnly} onChange={setAvailableOnly} />
        </div>
      </div>

      <div className="mb-8">
        <CategoryFilter
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          products={serverProducts}
        />
      </div>

      {/* Desktop grouped view when no category selected */}
      <div className="hidden lg:block">
        {selectedCategory ? (
          // Si hay categoría seleccionada, mostrar grid plano de resultados
          <div className="grid grid-cols-4 gap-6">
            {filteredProducts.map((product) => renderProductArticle(product))}
          </div>
        ) : (
          // Agrupar por categoría (ordenadas alfabéticamente)
          <>
            {sortedCategories.map((category) => {
              // crear copia ordenada de items por nombre
              const items = (productsByCategory[category] || []).slice().sort((a, b) =>
                String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" })
              );

              return (
                <section key={category} className="mb-8">
                  <h3 className="text-2xl font-bold text-foreground mb-4">{category}</h3>
                  <div className="grid grid-cols-4 gap-6">
                    {items.map((product) => renderProductArticle(product))}
                  </div>
                </section>
              );
            })}
          </>
        )}
      </div>

      {/* Mobile grouped view */}
      {/* Nota: en móvil ya no usamos la versión 'compact' — usamos la tarjeta completa pero con escala ligera aplicada en el propio ProductCard */}
      <div className="lg:hidden grid grid-cols-2 gap-3 md:gap-4">
        {selectedCategory ? (
          <>
            {filteredProducts.map((product) => renderProductArticle(product /* compact = false */))}
          </>
        ) : (
          <>
            {sortedCategories.map((category) => {
              const items = (productsByCategory[category] || []).slice().sort((a, b) =>
                String(a.name ?? "").localeCompare(String(b.name ?? ""), "es", { sensitivity: "base" })
              );

              return (
                <div key={category} className="col-span-2">
                  <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3 px-1">{category}</h3>
                  <div className="grid grid-cols-2 gap-3 md:gap-4 mb-6">
                    {items.map((product) => renderProductArticle(product /* compact = false */))}
                  </div>
                </div>
              );
            })}
          </>
        )}
      </div>

      {filteredProducts.length === 0 && !isLoading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground text-lg">No se encontraron productos</p>
        </div>
      )}

      {/* Overlay "actualizando" cuando hay datos pero se está recargando */}
      {isLoading === false ? null : (
        <div className="mt-6 text-center text-sm text-muted-foreground">
          {isLoading && <p>Cargando productos...</p>}
        </div>
      )}
    </main>
  );
}

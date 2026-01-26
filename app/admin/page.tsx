// app/admin/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminProductList } from "@/components/admin-product-list";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createAdminClient } from "@/lib/supabase/admin";

type ProductImage = { id: string; image_url: string; display_order?: number };
type CategoryObj = { name?: string } | null;

type ProductItemLocal = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  stock?: number;
  available?: boolean | number | string | null;
  category?: string | null; // prefer product.category string
  categories?: CategoryObj; // matches AdminProductList expectation (legacy shape)
  product_images?: ProductImage[];
  product_categories?: any; // raw rows from product_categories if needed
};

export default async function AdminDashboard() {
  const admin = createAdminClient();

  try {
    // 1) Fetch products with images (no nested product_categories to avoid the missing-FK error)
    const { data: productsRaw, error: productsError } = await admin
      .from("products")
      .select(`
        id,
        name,
        description,
        price,
        available,
        category,
        product_images(id, image_url, display_order)
      `)
      .order("created_at", { ascending: false });

    console.log("[AdminDashboard] productsError:", productsError);
    console.log("[AdminDashboard] productsRaw length:", Array.isArray(productsRaw) ? productsRaw.length : productsRaw);

    if (productsError) {
      // Mostrar error al usuario en UI (rendereado más abajo)
      return renderWithError(productsError);
    }

    const productsArray = Array.isArray(productsRaw) ? productsRaw : [];

    // If no products, render normally with empty list
    if (productsArray.length === 0) {
      return renderPage([]);
    }

    // 2) Fetch all product_categories for these products (if table exists)
    const productIds = productsArray.map((p: any) => p.id).filter(Boolean);

    let productCategoriesRaw: Array<{ product_id: string; category_id: string | number }> = [];
    try {
      const { data: pcData, error: pcErr } = await admin
        .from("product_categories")
        .select("product_id, category_id")
        .in("product_id", productIds);

      if (pcErr) {
        // Si falla esta consulta, no abortamos: seguimos con products sin categorías pero logueamos
        console.warn("[AdminDashboard] product_categories fetch warning:", pcErr);
      } else {
        productCategoriesRaw = Array.isArray(pcData) ? pcData : [];
      }
    } catch (e) {
      console.warn("[AdminDashboard] product_categories fetch failed:", e);
    }

    // 3) Fetch categories table to map ids -> names
    let categoriesRaw: Array<{ id: string; id_int?: number; name?: string }> = [];
    try {
      const { data: cats, error: catsErr } = await admin.from("categories").select("id, id_int, name");
      if (catsErr) {
        console.warn("[AdminDashboard] categories fetch warning:", catsErr);
      } else {
        categoriesRaw = Array.isArray(cats) ? cats : [];
      }
    } catch (e) {
      console.warn("[AdminDashboard] categories fetch failed:", e);
    }

    // 4) Build a map to resolve category_id -> name. We will support both UUID(id) and id_int.
    const categoryByUuid = new Map<string, string>();
    const categoryByIdInt = new Map<number, string>();
    for (const c of categoriesRaw) {
      if (c.id && c.name) categoryByUuid.set(String(c.id), String(c.name));
      if (typeof c.id_int === "number" && c.name) categoryByIdInt.set(c.id_int, String(c.name));
    }

    // 5) Build a map productId -> array of category names (resolved)
    const productIdToCategoryNames = new Map<string, string[]>();
    for (const pc of productCategoriesRaw) {
      const pid = String(pc.product_id);
      const rawCatId = pc.category_id;

      let resolvedName: string | null = null;

      // Try as UUID string
      if (typeof rawCatId === "string") {
        if (categoryByUuid.has(rawCatId)) {
          resolvedName = categoryByUuid.get(rawCatId) ?? null;
        } else {
          // Maybe the category_id is a numeric string (id_int)
          const asNum = Number(rawCatId);
          if (!Number.isNaN(asNum) && categoryByIdInt.has(asNum)) {
            resolvedName = categoryByIdInt.get(asNum) ?? null;
          }
        }
      } else if (typeof rawCatId === "number") {
        // Try numeric id_int
        if (categoryByIdInt.has(rawCatId)) resolvedName = categoryByIdInt.get(rawCatId) ?? null;
      }

      if (resolvedName) {
        const arr = productIdToCategoryNames.get(pid) ?? [];
        arr.push(resolvedName);
        productIdToCategoryNames.set(pid, arr);
      }
    }

    // 6) Normalize products to the shape expected by AdminProductList
    const products: ProductItemLocal[] = productsArray.map((p: any) => {
      const images: ProductImage[] = Array.isArray(p.product_images)
        ? p.product_images.map((img: any) => ({
            id: String(img?.id ?? ""),
            image_url: img?.image_url ?? "",
            display_order: typeof img?.display_order === "number" ? img.display_order : 0,
          }))
        : [];

      // If product.category field (string) exists prefer it
      const categoryFromField: string | null = typeof p.category === "string" && p.category.trim() ? p.category.trim() : null;

      // Categories resolved from product_categories mapping
      const resolvedNames = productIdToCategoryNames.get(String(p.id)) ?? [];

      // categories prop expected is single object { name?: string } | null; take first resolved or null
      const firstCatObj: CategoryObj = resolvedNames.length ? { name: resolvedNames[0] } : null;

      // category string we pass to the UI: prefer product.category, else first resolved name, else null
      const categoryString: string | null = categoryFromField ?? (resolvedNames.length ? resolvedNames[0] : null);

      // raw product_categories rows for reference (could be empty)
      const rawPcRows = productCategoriesRaw.filter((r) => String(r.product_id) === String(p.id));

      return {
        id: String(p.id ?? ""),
        name: p.name ?? "Sin nombre",
        description: p.description ?? null,
        price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
        available: p.available,
        category: categoryString,
        categories: firstCatObj,
        product_images: images,
        product_categories: rawPcRows,
      };
    });

    // Render page with products
    return renderPage(products);
  } catch (err) {
    console.error("[AdminDashboard] unexpected error:", err);
    return renderWithError(err);
  }
}

/**
 * Helper: render page when we have products array
 */
function renderPage(products: ProductItemLocal[]) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-1 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
            <p className="text-muted-foreground">Gestiona tus productos y catálogo</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Crear Producto</Link>
          </Button>
        </div>

        <AdminGuard>
          <div className="mb-4 text-sm text-muted-foreground">
            {Array.isArray(products) ? `Productos encontrados: ${products.length}` : "Productos: 0"}
          </div>

          <AdminProductList products={products} />
        </AdminGuard>
      </main>
    </div>
  );
}

/**
 * Helper: render a page showing a friendly error (with JSON)
 */
function renderWithError(error: unknown) {
  const json = error instanceof Error ? { message: error.message } : error ?? { message: "Unknown error" };
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
            <p className="text-muted-foreground">Gestiona tus productos y catálogo</p>
          </div>
          <Button asChild>
            <Link href="/admin/products/new">Crear Producto</Link>
          </Button>
        </div>

        <AdminGuard>
          <div className="mb-6 border border-destructive/40 bg-destructive/10 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-destructive mb-1">Error al cargar productos</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Hubo un problema al consultar la base de datos. Revisa los logs del servidor para más detalles.
            </p>
            <pre className="text-xs overflow-auto p-2 bg-muted rounded">{JSON.stringify(json, null, 2)}</pre>
          </div>

          <AdminProductList products={[]} />
        </AdminGuard>
      </main>
    </div>
  );
}

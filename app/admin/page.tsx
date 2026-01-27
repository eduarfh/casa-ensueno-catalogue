// app/admin/page.tsx
export const dynamic = "force-dynamic";

import React from "react";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { AdminProductList } from "@/components/admin-product-list";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

type ProductImage = { id: string; image_url: string; display_order?: number };
type CategoryObj = { name?: string } | null;

type ProductItemLocal = {
  id: string;
  name: string;
  description?: string | null;
  price?: number | string | null;
  stock?: number;
  available?: boolean | number | string | null;
  category?: string | null;
  categories?: CategoryObj;
  product_images?: ProductImage[];
  product_categories?: any;
};

export default async function AdminDashboard() {
  try {
    // 0) Verificar sesión usando el cliente ligado al request (lee cookies)
    const serverSupabase = await createServerClient({ allowSetCookies: true });
    const { data: userData, error: userErr } = await serverSupabase.auth.getUser();

    if (userErr || !userData?.user) {
      // No hay sesión -> redirigir a login
      return redirect("/auth/login");
    }

    const user = userData.user;

    // 1) Verificar is_admin usando el mismo server client (aplican RLS/AUTH)
    const { data: adminRow, error: adminErr } = await serverSupabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr || !adminRow?.is_admin) {
      // No es admin -> redirigir a login (o a 403 si prefieres)
      return redirect("/auth/login");
    }

    // 2) Validado: ahora se puede usar el service-role admin client para las queries
    const admin = createAdminClient();

    // 3) Obtener productos con product_images
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
      return renderWithError(productsError);
    }

    const productsArray = Array.isArray(productsRaw) ? productsRaw : [];

    if (productsArray.length === 0) {
      return renderPage([]);
    }

    // 4) Fetch product_categories (si existe la tabla)
    const productIds = productsArray.map((p: any) => p.id).filter(Boolean);
    let productCategoriesRaw: Array<{ product_id: string; category_id: string | number }> = [];
    try {
      const { data: pcData, error: pcErr } = await admin
        .from("product_categories")
        .select("product_id, category_id")
        .in("product_id", productIds);

      if (pcErr) {
        console.warn("[AdminDashboard] product_categories fetch warning:", pcErr);
      } else {
        productCategoriesRaw = Array.isArray(pcData) ? pcData : [];
      }
    } catch (e) {
      console.warn("[AdminDashboard] product_categories fetch failed:", e);
    }

    // 5) Fetch categories table para mapear ids -> nombres
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

    // 6) Build maps para resolver category_id -> name (UUID y id_int)
    const categoryByUuid = new Map<string, string>();
    const categoryByIdInt = new Map<number, string>();
    for (const c of categoriesRaw) {
      if (c.id && c.name) categoryByUuid.set(String(c.id), String(c.name));
      if (typeof c.id_int === "number" && c.name) categoryByIdInt.set(c.id_int, String(c.name));
    }

    // 7) Map productId -> category names
    const productIdToCategoryNames = new Map<string, string[]>();
    for (const pc of productCategoriesRaw) {
      const pid = String(pc.product_id);
      const rawCatId = pc.category_id;
      let resolvedName: string | null = null;

      if (typeof rawCatId === "string") {
        if (categoryByUuid.has(rawCatId)) {
          resolvedName = categoryByUuid.get(rawCatId) ?? null;
        } else {
          const asNum = Number(rawCatId);
          if (!Number.isNaN(asNum) && categoryByIdInt.has(asNum)) {
            resolvedName = categoryByIdInt.get(asNum) ?? null;
          }
        }
      } else if (typeof rawCatId === "number") {
        if (categoryByIdInt.has(rawCatId)) resolvedName = categoryByIdInt.get(rawCatId) ?? null;
      }

      if (resolvedName) {
        const arr = productIdToCategoryNames.get(pid) ?? [];
        arr.push(resolvedName);
        productIdToCategoryNames.set(pid, arr);
      }
    }

    // 8) Normalizar productos al shape esperado por AdminProductList
    const products: ProductItemLocal[] = productsArray.map((p: any) => {
      const images: ProductImage[] = Array.isArray(p.product_images)
        ? p.product_images.map((img: any) => ({
          id: String(img?.id ?? ""),
          image_url: img?.image_url ?? "",
          display_order: typeof img?.display_order === "number" ? img.display_order : 0,
        }))
        : [];

      const categoryFromField: string | null =
        typeof p.category === "string" && p.category.trim() ? p.category.trim() : null;

      const resolvedNames = productIdToCategoryNames.get(String(p.id)) ?? [];
      const firstCatObj: CategoryObj = resolvedNames.length ? { name: resolvedNames[0] } : null;
      const categoryString: string | null = categoryFromField ?? (resolvedNames.length ? resolvedNames[0] : null);
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

    // 9) Render page con productos
    return renderPage(products);
  } catch (err) {
    console.error("[AdminDashboard] unexpected error:", err);
    return renderWithError(err);
  }
}

/**
 * Helper: render page cuando tenemos products array
 */
function renderPage(products: ProductItemLocal[]) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-1 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
            <p className="text-muted-foreground">Gestiona los productos e información del catálogo</p>
          </div>

        </div>

        <AdminGuard>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {Array.isArray(products) ? `Productos encontrados: ${products.length}` : "Productos: 0"}
            </div>

            <Button variant="outline" size="sm">
              <Link
                href="/admin/products/new"
                className="text-xs sm:text-sm font-medium transition-colors px-2 py-1"
              >
                Crear Producto
              </Link>
            </Button>
          </div>



          <AdminProductList products={products} />
        </AdminGuard>
      </main>
    </div>
  );
}

/**
 * Helper: render a page mostrando un error amigable (con JSON)
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

        </div>

        <AdminGuard>
          <div className="mb-6 border border-destructive/40 bg-destructive/10 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-destructive mb-1">Error al cargar productos</h2>
            <p className="text-sm text-muted-foreground mb-2">
              Hubo un problema al consultar la base de datos. Revisa los logs del servidor para más detalles.
            </p>
            <pre className="text-xs overflow-auto p-2 bg-muted rounded">{JSON.stringify(json, null, 2)}</pre>
          </div>
          <Button asChild variant={"outline"}>
            <Link href="/admin/products/new">Crear Producto</Link>
          </Button>
          <AdminProductList products={[]} />
        </AdminGuard>
      </main>
    </div>
  );
}

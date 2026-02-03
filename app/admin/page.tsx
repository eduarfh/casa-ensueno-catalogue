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
import StoreInfo from "@/components/store-info";
import StorageUsageCard from "@/components/storage-usage-card";

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

    // 4) (OPCIONAL) Fetch product_categories (si necesitas la relación)
    //    Dejamos la consulta a product_categories —pero NO consultamos categories para evitar PGRST205.
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

    // NOTA: no se hace fetch a la tabla `categories` aquí porque en tu instancia parece no existir
    // y eso generaba los warnings PGRST205. Si en el futuro la tabla existe, podemos reintroducir
    // la resolución id -> name.

    // 5) Normalizar productos al shape esperado por AdminProductList
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

      // como no tenemos la tabla categories, no resolvemos nombres desde product_categories.
      const resolvedNames: string[] = []; // vacío por ahora
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

    // 6) Render page con productos
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

        <StorageUsageCard />
        <AdminGuard>
          <div className="flex items-center justify-between mb-4">
            <div className="text-sm text-muted-foreground">
              {Array.isArray(products) ? `Productos encontrados: ${products.length}` : "Productos: 0"}
            </div>

            <Button variant="outline" size="sm">
              <Link href="/admin/products/new" className="text-xs sm:text-sm font-medium transition-colors px-2 py-1">
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

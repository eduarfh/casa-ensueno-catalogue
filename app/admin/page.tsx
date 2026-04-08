export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createAdminClient } from "@/lib/supabase/admin";
import { cookies } from "next/headers";
import StorageUsageCard from "@/components/storage-usage-card";
import { AdminProductsWithSearch } from "@/components/admin-products-with-search";
import { getStoragePublicUrl } from "@/lib/storage-utils";

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
    // Verificar sesión de admin usando cookies
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return redirect("/auth/login");
    }

    // Usar el admin client para las queries
    const admin = createAdminClient();

    // Obtener productos con product_images
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

    // Fetch product_categories
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

    // Normalizar productos
    const products: ProductItemLocal[] = productsArray.map((p: any) => {
      const images: ProductImage[] = Array.isArray(p.product_images)
        ? p.product_images.map((img: any) => ({
          id: String(img?.id ?? ""),
          image_url: getStoragePublicUrl(img?.image_url) ?? "",
          display_order: typeof img?.display_order === "number" ? img.display_order : 0,
        }))
        : [];

      const categoryFromField: string | null =
        typeof p.category === "string" && p.category.trim() ? p.category.trim() : null;

      const resolvedNames: string[] = [];
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
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold mb-2">Dashboard de Administración</h1>
            <p className="text-muted-foreground">Gestiona los productos e información del catálogo</p>
          </div>

        </div>


        <AdminGuard>
          <div className="space-y-6">
            <AdminProductsWithSearch products={products} />
            <StorageUsageCard />
          </div>
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
          <div className="mt-4">
            <AdminProductsWithSearch products={[]} />
          </div>
        </AdminGuard>
      </main>
    </div>
  );
}

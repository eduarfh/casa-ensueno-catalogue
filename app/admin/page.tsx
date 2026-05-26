export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { query } from "@/lib/db";
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

    // Obtener productos con product_images usando PostgreSQL
    const result = await query(`
      SELECT p.*, 
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL) as product_images
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const productsRaw = result.rows;

    console.log("[AdminDashboard] products length:", productsRaw.length);

    if (productsRaw.length === 0) {
      return renderPage([]);
    }

    // Obtener product_categories si la tabla existe
    const productIds = productsRaw.map((p: any) => p.id).filter(Boolean);
    let productCategoriesRaw: Array<{ product_id: string; category_id: string | number }> = [];
    
    if (productIds.length > 0) {
      try {
        // Verificar si la tabla existe
        const tableCheck = await query(`
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'product_categories'
          ) as exists
        `);
        
        if (tableCheck.rows[0]?.exists) {
          const pcResult = await query(
            'SELECT product_id, category_id FROM product_categories WHERE product_id = ANY($1)',
            [productIds]
          );
          productCategoriesRaw = pcResult.rows;
        }
      } catch (e) {
        // Tabla no existe o error, continuar sin product_categories
        console.log("[AdminDashboard] product_categories not available, skipping");
      }
    }

    // Normalizar productos
    const products: ProductItemLocal[] = productsRaw.map((p: any) => {
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

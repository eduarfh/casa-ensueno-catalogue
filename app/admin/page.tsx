export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { query } from "@/lib/db";
import { cookies } from "next/headers";
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
  currencies?: any[];
};

async function getProductCategories(productIds: string[]) {
  if (productIds.length === 0) return [];

  try {
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
      return pcResult.rows;
    }
  } catch (e) {
    console.log("[AdminDashboard] product_categories not available, skipping");
  }
  
  return [];
}

function normalizeProduct(
  p: any, 
  productCategoriesRaw: Array<{ product_id: string; category_id: string | number }>
): ProductItemLocal {
  const images: ProductImage[] = Array.isArray(p.product_images)
    ? p.product_images.map((img: any) => ({
        id: String(img?.id ?? ""),
        image_url: getStoragePublicUrl(img?.image_url) ?? "",
        display_order: typeof img?.display_order === "number" ? img.display_order : 0,
      }))
    : [];

  const categoryFromField: string | null =
    typeof p.category === "string" && p.category.trim() ? p.category.trim() : null;

  const rawPcRows = productCategoriesRaw.filter((r) => String(r.product_id) === String(p.id));

  return {
    id: String(p.id ?? ""),
    name: p.name ?? "Sin nombre",
    description: p.description ?? null,
    price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
    available: p.available,
    category: categoryFromField,
    categories: null,
    product_images: images,
    product_categories: rawPcRows,
    currencies: p.currencies || [],
  };
}

export default async function AdminDashboard() {
  try {
    // Verificar sesión de admin
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return redirect("/auth/login");
    }

    // Obtener productos con imágenes y monedas
    const result = await query(`
      SELECT p.*, 
        json_agg(
          json_build_object(
            'id', pi.id,
            'image_url', pi.image_url,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order
        ) FILTER (WHERE pi.id IS NOT NULL) as product_images,
        (
          SELECT json_agg(
            json_build_object(
              'currency_id', c.id,
              'currency_code', c.code,
              'currency_symbol', c.symbol,
              'price', pc.price
            ) ORDER BY c.display_order
          )
          FROM product_currencies pc
          JOIN currencies c ON pc.currency_id = c.id AND c.is_active = true
          WHERE pc.product_id = p.id
        ) as currencies
      FROM products p
      LEFT JOIN product_images pi ON p.id = pi.product_id
      GROUP BY p.id
      ORDER BY p.created_at DESC
    `);

    const productsRaw = result.rows;
    console.log("[AdminDashboard] products length:", productsRaw.length);

    // Obtener categorías de productos si existen
    const productIds = productsRaw.map((p: any) => p.id).filter(Boolean);
    const productCategoriesRaw = await getProductCategories(productIds);

    // Normalizar productos
    const products: ProductItemLocal[] = productsRaw.map((p: any) => 
      normalizeProduct(p, productCategoriesRaw)
    );

    return <AdminLayout products={products} />;
  } catch (err) {
    console.error("[AdminDashboard] unexpected error:", err);
    const errorMessage = err instanceof Error ? err.message : "Unknown error";
    return <AdminLayout products={[]} error={errorMessage} />;
  }
}

function AdminLayout({ 
  products, 
  error 
}: { 
  products: ProductItemLocal[]; 
  error?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />
      <div className="h-24 sm:h-28 md:h-32" />

      <main className="container mx-auto px-2 py-8">
        <div className="flex items-start justify-between mb-3">
          <h2 className="text-3xl font-bold mb-2">
            {error ? "Administración" : "Gestión de productos"}
          </h2>
        </div>

        <AdminGuard>
          {error ? (
            <div className="mb-6 border border-destructive/40 bg-destructive/10 rounded-lg p-4">
              <h2 className="text-lg font-semibold text-destructive mb-1">
                Error al cargar productos
              </h2>
              <p className="text-sm text-muted-foreground mb-2">
                Hubo un problema al consultar la base de datos. Revisa los logs del servidor para más detalles.
              </p>
              <pre className="text-xs overflow-auto p-2 bg-muted rounded">
                {JSON.stringify({ message: error }, null, 2)}
              </pre>
            </div>
          ) : null}
          
          <div className="space-y-6">
            <AdminProductsWithSearch products={products} />
          </div>
        </AdminGuard>
      </main>
    </div>
  );
}

// app/admin/products/[id]/page.tsx
export const dynamic = "force-dynamic";

import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { AdminBackToDashboard } from "@/components/admin-back-to-dashboard";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: Props) {
  // Verificar sesión de admin usando cookies
  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');

  if (!session?.value) {
    return redirect("/auth/login");
  }

  const { id } = await params;
  const isNewProduct = id === "new";

  let product: any = null;

  if (!isNewProduct) {
    // Obtener producto con imágenes
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
      WHERE p.id = $1
      GROUP BY p.id
    `, [id]);

    product = result.rows[0];

    if (!product) {
      redirect("/admin");
    }
  }

  // Obtener categorías únicas desde los productos existentes
  let categories: any[] = [];
  try {
    const result = await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    categories = result.rows.map((row: any, index: number) => ({
      id_int: index + 1,
      name: row.category
    }));
  } catch (err) {
    console.error('[EditProductPage] Error fetching categories:', err);
  }

  const categoriesForClient = categories.map((c: any) => ({ 
    id: String(c?.id_int ?? ""), 
    name: c?.name ?? "" 
  }));

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] px-4">
        <div className="w-full max-w-2xl">
          <AdminBackToDashboard />

          <div>
            <h1 className="text-3xl font-bold mb-2">{isNewProduct ? "Crear Producto" : "Editar Producto"}</h1>
            <p className="text-muted-foreground mb-8">
              {isNewProduct ? "Agrega un nuevo producto al catálogo" : "Actualiza la información del producto"}
            </p>

            <AdminGuard>
              <ProductForm product={product || undefined} categories={categoriesForClient || []} />
            </AdminGuard>
          </div>
        </div>
      </main>
    </div>
  );
}

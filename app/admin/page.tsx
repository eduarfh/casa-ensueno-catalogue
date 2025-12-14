export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminProductList } from "@/components/admin-product-list";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  const { data: productsRaw } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      available,
      product_images(id, image_url, display_order),
      product_categories(category_id, categories(id, name))
    `,
    )
    .order("created_at", { ascending: false });

  // Normalizar categorías para pasar un array plano categories: [{id,name}, ...]
  const products = (productsRaw || []).map((p: any) => {
    const cats = (p.product_categories || []).map((pc: any) => pc.categories).filter(Boolean);
    return {
      ...p,
      categories: cats,
    };
  });

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
          <AdminProductList products={products || []} />
        </AdminGuard>
      </main>
    </div>
  );
}

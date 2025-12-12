// app/admin/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AdminProductList } from "@/components/admin-product-list";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createServerClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const supabase = await createServerClient();

  const { data: products } = await supabase
    .from("products")
    .select(
      `
      id,
      name,
      description,
      price,
      stock,
      available,
      category_id,
      categories(name),
      product_images(id, image_url)
    `,
    )
    .order("created_at", { ascending: false });

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

// app/admin/products/new/page.tsx
export const dynamic = "force-dynamic";

import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { ChevronLeft } from "lucide-react";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { query } from "@/lib/db";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function NewProductPage() {
  // Verificar sesión de admin usando cookies
  const cookieStore = await cookies();
  const session = cookieStore.get('admin-session');

  if (!session?.value) {
    return redirect("/auth/login");
  }

  // Obtener categorías únicas desde los productos existentes
  let categories: any[] = [];
  try {
    const result = await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL ORDER BY category');
    categories = result.rows.map((row, index) => ({
      id_int: index + 1,
      name: row.category
    }));
  } catch (err) {
    console.error('[NewProductPage] Error fetching categories:', err);
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
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>

          <AdminGuard>
            <div>
              <h1 className="text-3xl font-bold mb-2">Crear Nuevo Producto</h1>
              <p className="text-muted-foreground mb-8">Agrega un nuevo producto a tu catálogo</p>

              <ProductForm categories={categoriesForClient || []} />
            </div>
          </AdminGuard>
        </div>
      </main>
    </div>
  );
}

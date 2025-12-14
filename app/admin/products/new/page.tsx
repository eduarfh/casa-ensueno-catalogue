export const dynamic = "force-dynamic";

import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { ChevronLeft } from "lucide-react";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { createServerClient } from "@/lib/supabase/server";

export default async function NewProductPage() {
  const supabase = await createServerClient();

  const { data: categories } = await supabase.from("categories").select("id, name").order("name");

  return (
    <div className="min-h-screen bg-background">
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <AdminGuard>
          <div className="max-w-2xl">
            <h1 className="text-3xl font-bold mb-2">Crear Nuevo Producto</h1>
            <p className="text-muted-foreground mb-8">Agrega un nuevo producto a tu catálogo</p>

            <ProductForm categories={categories || []} />
          </div>
        </AdminGuard>
      </main>
    </div>
  );
}

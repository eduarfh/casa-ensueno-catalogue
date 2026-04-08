// app/admin/products/[id]/page.tsx
export const dynamic = "force-dynamic";

import { createAdminClient } from "@/lib/supabase/admin";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import Link from "next/link";
import { ProductForm } from "@/components/product-form";
import { ChevronLeft } from "lucide-react";
import AdminGuard from "@/components/admin-guard";
import { AdminHeader } from "@/components/admin-header";
import { getStoragePublicUrl } from "@/lib/storage-utils";

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
  const supabase = createAdminClient();

  const isNewProduct = id === "new";

  let product: any = null;

  if (!isNewProduct) {
    const { data } = await supabase
      .from("products")
      .select(
        `
        id,
        name,
        description,
        price,
        available,
        category,
        product_images(id, image_url, display_order)
      `,
      )
      .eq("id", id)
      .single();

    product = data;

    if (!product) {
      redirect("/admin");
    }
  }

  // Traemos categorías usando id_int y las mapeamos a {id: string, name}
  const { data: categories } = await supabase.from("categories").select("id_int, name").order("name");

  const categoriesForClient = (categories || []).map((c: any) => ({ id: String(c?.id_int ?? ""), name: c?.name ?? "" }));

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

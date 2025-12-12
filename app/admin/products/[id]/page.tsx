// app/admin/products/[id]/page.tsx

import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import Link from "next/link"
import { ProductForm } from "@/components/product-form"
import { ChevronLeft } from "lucide-react"
import AdminGuard from "@/components/admin-guard"
import { AdminHeader } from "@/components/admin-header"

interface Props {
  params: Promise<{ id: string }>
}

export default async function EditProductPage({ params }: Props) {
  const { id } = await params
  const supabase = await createClient()

  const isNewProduct = id === "new"

  let product = null

  if (!isNewProduct) {
    const { data } = await supabase
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
        product_images(id, image_url, display_order)
      `,
      )
      .eq("id", id)
      .single()

    product = data

    // If product not found, redirect back to admin
    if (!product) {
      redirect("/admin")
    }
  }

  const { data: categories } = await supabase.from("categories").select("id, name").order("name")

  return (
    <div className="min-h-screen bg-background">
      {/* Client header (shows email, logout) */}
      <AdminHeader />

      <main className="container mx-auto px-4 py-8">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Volver al dashboard
        </Link>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold mb-2">{isNewProduct ? "Crear Producto" : "Editar Producto"}</h1>
          <p className="text-muted-foreground mb-8">
            {isNewProduct ? "Agrega un nuevo producto al catálogo" : "Actualiza la información del producto"}
          </p>

          {/* Client-side guard: solo permitirá ver el form si hay sesión */}
          <AdminGuard>
            <ProductForm product={product || undefined} categories={categories || []} />
          </AdminGuard>
        </div>
      </main>
    </div>
  )
}

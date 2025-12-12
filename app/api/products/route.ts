// app/api/products/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { name, description, price, stock, category_id, images } = await request.json()

    if (!name || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: product, error: productError } = await supabase
      .from("products")
      .insert({
        name,
        description,
        price: Number.parseFloat(price),
        stock: Number.parseInt(stock),
        category_id,
        available: Number.parseInt(stock) > 0,
      })
      .select()
      .single()

    if (productError) throw productError

    if (Array.isArray(images) && images.length) {
      const imageRecords = images.map((img: { url: string; display_order: number }) => ({
        product_id: product.id,
        image_url: img.url,
        display_order: img.display_order,
      }))

      const { error: imgError } = await supabase.from("product_images").insert(imageRecords)
      if (imgError) console.error("Image insert error:", imgError)
    }

    return NextResponse.json(product, { status: 201 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product"
    console.error("[product-create] ", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

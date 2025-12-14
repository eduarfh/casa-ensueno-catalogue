// app/api/products/[id]/route.ts
import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { del } from "@vercel/blob" // SDK function to delete blobs

async function safeDeleteBlob(url: string | null | undefined) {
  if (!url) return
  const token = process.env.BLOB_READ_WRITE_TOKEN
  try {
    await del(url, { token })
    console.log("[blob] deleted:", url)
  } catch (err: any) {
    console.warn("[blob] delete failed for", url, ":", err?.message || err)
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const supabase = await createServerClient()

    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: adminData } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single()
    if (!adminData?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    // Fetch product images URLs to delete blobs first
    const { data: images } = await supabase.from("product_images").select("image_url").eq("product_id", id)
    if (images && images.length) {
      await Promise.all(images.map((img: any) => safeDeleteBlob(img.image_url)))
    }

    // Delete product (product_images have FK cascade)
    const { error } = await supabase.from("products").delete().eq("id", id)
    if (error) throw error

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting product"
    console.error("[product-delete] ", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { name, description, price, available, category_id, images } = body

    const supabase = await createServerClient()
    const { data: userData } = await supabase.auth.getUser()
    const user = userData?.user
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data: adminData } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single()
    if (!adminData?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    if (!name || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Ensure boolean
    const availableBool = available === true

    // Update product fields
    const { data: product, error: productError } = await supabase
      .from("products")
      .update({
        name,
        description,
        price: Number.parseFloat(price),
        available: availableBool,
        category_id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (productError) throw productError

    // If images is provided, replace images: delete old blobs, delete rows, insert new rows
    if (Array.isArray(images)) {
      const { data: existingImgs } = await supabase.from("product_images").select("id, image_url").eq("product_id", product.id)
      if (existingImgs && existingImgs.length) {
        await Promise.all(existingImgs.map((img: any) => safeDeleteBlob(img.image_url)))
      }

      await supabase.from("product_images").delete().eq("product_id", product.id)

      const imageRecords = images.map((img: { url: string; display_order: number }) => ({
        product_id: product.id,
        image_url: img.url,
        display_order: img.display_order,
      }))
      if (imageRecords.length) {
        const { error: imageError } = await supabase.from("product_images").insert(imageRecords)
        if (imageError) console.error("Product images insert error:", imageError)
      }
    }

    return NextResponse.json(product, { status: 200 })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating product"
    console.error("[product-update] ", err)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

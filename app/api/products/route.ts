// app/api/products/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, price, available, categories, images } = body ?? {};

    if (!name || !Array.isArray(categories) || categories.length === 0) {
      return NextResponse.json({ error: "Missing required fields: name y categories" }, { status: 400 });
    }

    const admin = createAdminClient(); // service role client for writes that bypass RLS

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        name,
        description,
        price: Number.parseFloat(price ?? 0),
        available: !!available,
        owner_id: user.id,
      })
      .select()
      .single();

    if (productError) throw productError;

    // insertar relaciones product_categories
    const catRecords = categories.map((cid: string) => ({
      product_id: product.id,
      category_id: cid,
    }));
    if (catRecords.length) {
      const { error: pcErr } = await admin.from("product_categories").insert(catRecords);
      if (pcErr) console.error("[product-create] product_categories insert error:", pcErr);
    }

    // insertar imágenes si vienen (service role también)
    if (Array.isArray(images) && images.length) {
      const imageRecords = images.map((img: { url: string; display_order?: number }) => ({
        product_id: product.id,
        image_url: img.url,
        display_order: img.display_order ?? 0,
      }));
      const { error: imgError } = await admin.from("product_images").insert(imageRecords);
      if (imgError) console.error("[product-create] image insert error:", imgError);
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    console.error("[product-create] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

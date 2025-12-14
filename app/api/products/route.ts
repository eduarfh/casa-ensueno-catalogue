// app/api/products/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, price, disponibilidad, category_id, images } = body ?? {};

    if (!name || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const admin = createAdminClient();

    console.log('[product-create] user.id =', user?.id);
    console.log('[product-create] payload =', { name, category_id, price, disponibilidad, imagesLength: Array.isArray(images) ? images.length : 0 });

    const disponibilidadInt = Number.parseInt(String(disponibilidad ?? "0"), 10) || 0;

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        name,
        description,
        price: Number.parseFloat(price ?? 0),
        disponibilidad: disponibilidadInt,
        available: disponibilidadInt > 0,
        category_id,
        owner_id: user.id,
      })
      .select()
      .single();

    if (productError) throw productError;

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

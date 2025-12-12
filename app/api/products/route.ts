// app/api/products/route.ts
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    // Validar sesión con el cliente que respeta cookies
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json();
    const { name, description, price, stock, category_id, images } = body ?? {};

    if (!name || !category_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Usar admin client (service role) para evitar RLS al insertar
    const admin = createAdminClient();

    // justo antes de la inserción en app/api/products/route.ts
console.log('[product-create] user.id =', user?.id);
console.log('[product-create] payload =', { name, category_id, price, stock, imagesLength: Array.isArray(images) ? images.length : 0 });

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        name,
        description,
        price: Number.parseFloat(price ?? 0),
        stock: Number.parseInt(String(stock ?? "0"), 10),
        category_id,
        available: Number.parseInt(String(stock ?? "0"), 10) > 0,
        owner_id: user.id, // recomendable para auditoría y RLS futuras
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

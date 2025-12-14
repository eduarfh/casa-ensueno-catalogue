// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { del } from "@vercel/blob";

async function safeDeleteBlob(url: string | null | undefined) {
  if (!url) return;
  const token = process.env.BLOB_READ_WRITE_TOKEN;
  try {
    await del(url, { token });
    console.log("[blob] deleted:", url);
  } catch (err: any) {
    console.warn("[blob] delete failed for", url, ":", err?.message || err);
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const supabase = await createServerClient();

    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminData } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single();
    if (!adminData?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    // borrar blobs de images
    const { data: images } = await supabase.from("product_images").select("image_url").eq("product_id", id);
    if (images && images.length) {
      await Promise.all(images.map((img: any) => safeDeleteBlob(img.image_url)));
    }

    // eliminar product_categories asociadas (usamos admin client)
    const admin = createAdminClient();
    await admin.from("product_categories").delete().eq("product_id", id);

    // eliminar producto (las product_images tienen FK cascade)
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting product";
    console.error("[product-delete] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, price, available, categories, images } = body ?? {};

    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminData } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single();
    if (!adminData?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    if (!name || !Array.isArray(categories)) {
      return NextResponse.json({ error: "Missing required fields: name y categories" }, { status: 400 });
    }

    const availableBool = !!available;

    // actualizar producto
    const { data: product, error: productError } = await supabase
      .from("products")
      .update({
        name,
        description,
        price: Number.parseFloat(price ?? 0),
        available: availableBool,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (productError) throw productError;

    // sincronizar categories: borrar existentes + insertar nuevas (service role para evitar RLS)
    const admin = createAdminClient();
    const { error: delErr } = await admin.from("product_categories").delete().eq("product_id", product.id);
    if (delErr) console.error("[product-update] product_categories delete error:", delErr);

    // convertir categories a enteros (category_id es integer ahora)
    const catRecords = categories.map((cid: string | number) => ({
      product_id: product.id,
      category_id: Number(cid),
    }));
    if (catRecords.length) {
      const { error: pcErr } = await admin.from("product_categories").insert(catRecords);
      if (pcErr) console.error("[product-update] product_categories insert error:", pcErr);
    }

    // imágenes: reemplazar si viene array
    if (Array.isArray(images)) {
      const { data: existingImgs } = await supabase.from("product_images").select("id, image_url").eq("product_id", product.id);
      if (existingImgs && existingImgs.length) {
        await Promise.all(existingImgs.map((img: any) => safeDeleteBlob(img.image_url)));
      }

      await admin.from("product_images").delete().eq("product_id", product.id);

      const imageRecords = images.map((img: { url: string; display_order?: number }) => ({
        product_id: product.id,
        image_url: img.url,
        display_order: img.display_order ?? 0,
      }));
      if (imageRecords.length) {
        const { error: imgErr } = await admin.from("product_images").insert(imageRecords);
        if (imgErr) console.error("[product-update] image insert error:", imgErr);
      }
    }

    return NextResponse.json(product, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error updating product";
    console.error("[product-update] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// app/api/products/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient({ allowSetCookies: true });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
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

    // ---- Handle categories: accept UUIDs or id_int (numbers/strings of digits)
    const ids = categories.map((c: string | number) => String(c).trim());
    const idIntList: number[] = [];
    const uuidList: string[] = [];

    for (const s of ids) {
      if (/^\d+$/.test(s)) idIntList.push(Number(s));
      else if (uuidRegex.test(s)) uuidList.push(s);
      else {
        // invalid format
        return NextResponse.json({ error: `Invalid category identifier: ${s}` }, { status: 400 });
      }
    }

    // Resolve id_int -> uuid if needed
    const resolvedUuidMap: Record<number, string> = {};
    if (idIntList.length > 0) {
      const { data: found, error: fErr } = await admin
        .from("categories")
        .select("id,id_int")
        .in("id_int", idIntList);
      if (fErr) {
        console.error("[product-create] lookup categories by id_int error:", fErr);
        // but product already created — choose to rollback or return error:
        // We'll return an error so caller can retry (product exists though)
        return NextResponse.json({ error: "Error resolving categories", details: fErr.message }, { status: 500 });
      }
      (found || []).forEach((r: any) => {
        if (typeof r.id_int === "number" && r.id) resolvedUuidMap[r.id_int] = r.id;
      });

      const missing = idIntList.filter((i) => !resolvedUuidMap[i]);
      if (missing.length) {
        return NextResponse.json({ error: `No se encontró categoría(s) con id_int: ${missing.join(", ")}` }, { status: 400 });
      }
    }

    // Build product_categories inserts using UUIDs
    const catRecords = [
      ...uuidList.map((u) => ({ product_id: product.id, category_id: u })),
      ...idIntList.map((i) => ({ product_id: product.id, category_id: resolvedUuidMap[i] })),
    ];

    if (catRecords.length) {
      const { error: pcErr } = await admin.from("product_categories").insert(catRecords);
      if (pcErr) {
        console.error("[product-create] product_categories insert error:", pcErr);
        // decide: return error; product was created. We return 500 to surface the issue.
        return NextResponse.json({ error: "Error inserting product categories", details: pcErr.message }, { status: 500 });
      }
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

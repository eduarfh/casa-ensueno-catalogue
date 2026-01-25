// app/api/products/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUCKET = "casaensueno-files"; // ajusta

function extractPathFromStorageUrl(url: string, bucket: string) {
  try {
    const u = new URL(url);
    // patrón de Supabase public url: /storage/v1/object/public/<bucket>/<path>
    const idx = u.pathname.indexOf(`/storage/v1/object/public/${bucket}/`);
    if (idx !== -1) {
      return u.pathname.slice(idx + `/storage/v1/object/public/${bucket}/`.length);
    }
    // patrón posible de signed urls: /object/sign/<bucket>/<path>...
    const idx2 = u.pathname.indexOf(`/object/sign/${bucket}/`);
    if (idx2 !== -1) {
      return decodeURIComponent(u.pathname.slice(idx2 + `/object/sign/${bucket}/`.length));
    }
    // fallback: si hostname contiene supabase y bucket presente en pathname -> tomar después de bucket
    const part = u.pathname.split(`/${bucket}/`);
    if (part.length > 1) return part[1];
    return null;
  } catch {
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient({ allowSetCookies: true });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, category, images } = body ?? {};

    if (!name || !category || typeof category !== "string" || !String(category).trim()) {
      return NextResponse.json({ error: "Missing required fields: name y category" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Resolve category (mantengo tu lógica previa)
    const rawCat = String(category).trim();
    let categoryName: string | null = null;
    if (uuidRegex.test(rawCat)) {
      const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id", rawCat).maybeSingle();
      if (fErr) {
        console.error("[product-create] lookup category by uuid error:", fErr);
        return NextResponse.json({ error: "Error resolving category", details: fErr.message }, { status: 500 });
      }
      if (!found?.name) return NextResponse.json({ error: "Category UUID not found" }, { status: 404 });
      categoryName = found.name;
    } else if (/^\d+$/.test(rawCat)) {
      const idInt = Number(rawCat);
      const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id_int", idInt).maybeSingle();
      if (fErr) {
        console.error("[product-create] lookup category by id_int error:", fErr);
        return NextResponse.json({ error: "Error resolving category", details: fErr.message }, { status: 500 });
      }
      if (!found?.name) return NextResponse.json({ error: `No se encontró categoría con id_int ${idInt}` }, { status: 404 });
      categoryName = found.name;
    } else {
      categoryName = rawCat;
    }

    if (!categoryName) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const { data: product, error: productError } = await admin
      .from("products")
      .insert({
        name,
        description,
        price: Number.parseFloat(price ?? 0),
        available: !!available,
        owner_id: user.id,
        category: categoryName,
      })
      .select()
      .single();

    if (productError) throw productError;

    // ---------- manejar imágenes ----------
    // images puede venir como: [{ path: 'products/..', display_order: 0 }, { url: 'https://.../public/<bucket>/path', display_order: 1 }]
    if (Array.isArray(images) && images.length) {
      const imageRecords: { product_id: string; image_url: string; display_order?: number }[] = [];

      for (const img of images) {
        if (!img) continue;
        // si viene path directo
        if (img.path && typeof img.path === "string") {
          imageRecords.push({ product_id: product.id, image_url: img.path, display_order: img.display_order ?? 0 });
          continue;
        }
        // si viene url -> intentar extraer path del storage
        if (img.url && typeof img.url === "string") {
          const extracted = extractPathFromStorageUrl(img.url, BUCKET);
          if (extracted) {
            imageRecords.push({ product_id: product.id, image_url: extracted, display_order: img.display_order ?? 0 });
            continue;
          }
          // si no se puede extraer, guardamos la url completa (menos ideal)
          imageRecords.push({ product_id: product.id, image_url: img.url, display_order: img.display_order ?? 0 });
        }
      }

      if (imageRecords.length) {
        const { error: imgError } = await admin.from("product_images").insert(imageRecords);
        if (imgError) console.error("[product-create] image insert error:", imgError);
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    console.error("[product-create] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

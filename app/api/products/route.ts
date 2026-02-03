// app/api/products/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUCKET = "casaensueno-files"; // ajusta si hace falta

function extractPathFromStorageUrl(url: string, bucket: string) {
  try {
    const u = new URL(url);
    const idx = u.pathname.indexOf(`/storage/v1/object/public/${bucket}/`);
    if (idx !== -1) return u.pathname.slice(idx + `/storage/v1/object/public/${bucket}/`.length);
    const idx2 = u.pathname.indexOf(`/object/sign/${bucket}/`);
    if (idx2 !== -1) return decodeURIComponent(u.pathname.slice(idx2 + `/object/sign/${bucket}/`.length));
    const part = u.pathname.split(`/${bucket}/`);
    if (part.length > 1) return part[1];
    return null;
  } catch {
    return null;
  }
}

/**
 * HEAD -> devuelve lo mismo que GET sin cuerpo.
 */
export async function HEAD(request: Request) {
  return new NextResponse(null, { status: 200 });
}

/**
 * OPTIONS -> para evitar 405 en preflight.
 */
export async function OPTIONS(request: Request) {
  const headers = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS,HEAD",
    "Access-Control-Allow-Headers": "Content-Type",
  };
  return new NextResponse(null, { status: 204, headers });
}

/**
 * GET -> si ?onlyCategories=1 devuelve categorías únicas (sin exigir auth).
 * Si no hay onlyCategories, intenta devolver productos del usuario (requiere auth).
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const onlyCategories = url.searchParams.get("onlyCategories");

    const admin = createAdminClient();

    if (onlyCategories) {
      // Obtener categorías únicas desde products (global)
      const { data, error } = await admin.from("products").select("category");
      if (error) {
        console.error("[products-get] error fetching categories:", error);
        return NextResponse.json({ error: "Error fetching categories", details: error.message }, { status: 500 });
      }
      const cats = Array.isArray(data) ? data.map((r: any) => String(r.category || "").trim()).filter(Boolean) : [];
      const unique = Array.from(new Set(cats));
      return NextResponse.json({ categories: unique }, { status: 200 });
    }

    // Si no piden solo categories, intentamos devolver productos del usuario (si está autenticado)
    const supabase = await createServerClient({ allowSetCookies: true });
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: products, error: pErr } = await admin
      .from("products")
      .select("*")
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (pErr) {
      console.error("[products-get] error fetching products:", pErr);
      return NextResponse.json({ error: "Error fetching products", details: pErr.message }, { status: 500 });
    }
    return NextResponse.json(products ?? [], { status: 200 });
  } catch (err: unknown) {
    console.error("[products-get] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch products";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST -> crear producto (igual que tu lógica previa).
 */
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

    // manejar imágenes
    if (Array.isArray(images) && images.length) {
      const imageRecords: { product_id: string; image_url: string; display_order?: number }[] = [];

      for (const img of images) {
        if (!img) continue;
        if (img.path && typeof img.path === "string") {
          imageRecords.push({ product_id: product.id, image_url: img.path, display_order: img.display_order ?? 0 });
          continue;
        }
        if (img.url && typeof img.url === "string") {
          const extracted = extractPathFromStorageUrl(img.url, BUCKET);
          if (extracted) {
            imageRecords.push({ product_id: product.id, image_url: extracted, display_order: img.display_order ?? 0 });
            continue;
          }
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

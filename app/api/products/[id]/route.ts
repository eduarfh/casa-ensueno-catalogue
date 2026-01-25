// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
// Ajusta al nombre exacto de tu bucket
const BUCKET = "casaensueno-files";

/** Extrae el path en el bucket a partir de distintas formas de URL de Supabase */
function extractPathFromStorageUrl(url: string, bucket: string) {
  try {
    const u = new URL(url);
    // patrón public: /storage/v1/object/public/<bucket>/<path>
    const publicPrefix = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(publicPrefix);
    if (idx !== -1) {
      return decodeURIComponent(u.pathname.slice(idx + publicPrefix.length));
    }
    // patrón sign: /object/sign/<bucket>/... (varía por versiones)
    const signPrefix = `/object/sign/${bucket}/`;
    const idx2 = u.pathname.indexOf(signPrefix);
    if (idx2 !== -1) {
      return decodeURIComponent(u.pathname.slice(idx2 + signPrefix.length));
    }
    // fallback simple: split por /<bucket>/
    const parts = u.pathname.split(`/${bucket}/`);
    if (parts.length > 1) return decodeURIComponent(parts[1]);
    return null;
  } catch {
    return null;
  }
}

export async function PUT(request: Request, context: { params: any }) {
  try {
    // IMPORTANT: await params because Next can pass it as a Promise
    const { params } = context;
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // server client para auth (usa cookies)
    const supabase = await createServerClient({ allowSetCookies: true });

    // obtener usuario
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[products/:id/PUT] auth.getUser error:", userErr);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }
    const user = userData?.user ?? null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // revisar si es admin
    const adminCheck = createAdminClient();
    const { data: adminRow, error: adminErr } = await adminCheck
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr) {
      console.error("[products/:id/PUT] admin lookup error:", adminErr);
      return NextResponse.json({ error: "Error checking admin", details: adminErr.message }, { status: 500 });
    }
    if (!adminRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // leer body
    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, category, images } = body ?? {};

    if (!name && description === undefined && price === undefined && available === undefined && category === undefined && images === undefined) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const admin = createAdminClient();

    // --- Manejo de category (como en tu code original) ---
    const updatePayload: Record<string, any> = {};
    if (typeof name === "string") updatePayload.name = name;
    if (typeof description === "string") updatePayload.description = description;
    if (price !== undefined && price !== null) updatePayload.price = price;
    if (available !== undefined && available !== null) updatePayload.available = available;

    if (category !== undefined) {
      const raw = String(category).trim();
      if (!raw) {
        return NextResponse.json({ error: "category cannot be empty" }, { status: 400 });
      }

      let resolvedName: string | null = null;

      if (uuidRegex.test(raw)) {
        const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id", raw).maybeSingle();
        if (fErr) {
          console.error("[products/:id/PUT] lookup category by uuid error:", fErr);
          return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
        }
        if (!found?.name) {
          return NextResponse.json({ error: "Category UUID not found" }, { status: 404 });
        }
        resolvedName = found.name;
      } else if (/^\d+$/.test(raw)) {
        const idInt = Number(raw);
        const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id_int", idInt).maybeSingle();
        if (fErr) {
          console.error("[products/:id/PUT] lookup category by id_int error:", fErr);
          return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
        }
        if (!found?.name) {
          return NextResponse.json({ error: `Category with id_int ${idInt} not found` }, { status: 404 });
        }
        resolvedName = found.name;
      } else {
        resolvedName = raw;
      }

      updatePayload.category = resolvedName;
    }

    // --- Si images viene en el body: reemplazar imágenes del producto ---
    if (images !== undefined) {
      // Primero borrar todas las imágenes existentes (puedes cambiar a borrado selectivo si prefieres)
      const { error: delErr } = await admin.from("product_images").delete().eq("product_id", productId);
      if (delErr) {
        console.error("[products/:id/PUT] error deleting existing product_images:", delErr);
        // no abortamos: seguimos para poder intentar insertar nuevas si vienen
      }

      if (Array.isArray(images) && images.length) {
        const imageRecords: { product_id: string; image_url: string; display_order?: number }[] = [];

        for (const img of images) {
          if (!img) continue;
          if (typeof img === "string") {
            // si nos pasan una string simple la tratamos como path
            imageRecords.push({ product_id: productId, image_url: img, display_order: 0 });
            continue;
          }
          // si es objeto { path } o { url }
          if (img.path && typeof img.path === "string") {
            imageRecords.push({ product_id: productId, image_url: img.path, display_order: img.display_order ?? 0 });
            continue;
          }
          if (img.url && typeof img.url === "string") {
            const extracted = extractPathFromStorageUrl(img.url, BUCKET);
            if (extracted) {
              imageRecords.push({ product_id: productId, image_url: extracted, display_order: img.display_order ?? 0 });
              continue;
            }
            // fallback: guardar la url completa (no ideal, pero evita pérdida)
            imageRecords.push({ product_id: productId, image_url: img.url, display_order: img.display_order ?? 0 });
            continue;
          }
        }

        if (imageRecords.length) {
          const { error: insErr } = await admin.from("product_images").insert(imageRecords);
          if (insErr) {
            console.error("[products/:id/PUT] insert images error:", insErr);
            // devolvemos error si no se pudieron insertar
            return NextResponse.json({ error: "Error inserting images", details: insErr.message }, { status: 500 });
          }
        }
      }
    }

    // --- Actualizar otros campos ---
    if (Object.keys(updatePayload).length > 0) {
      const { error: updErr } = await admin.from("products").update(updatePayload).eq("id", productId);
      if (updErr) {
        console.error("[products/:id/PUT] update product error:", updErr);
        return NextResponse.json({ error: "Error updating product", details: updErr.message }, { status: 500 });
      }
    }

    return NextResponse.json({ ok: true, productId }, { status: 200 });
  } catch (err: unknown) {
    console.error("[products/:id/PUT] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

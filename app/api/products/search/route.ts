// app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const BUCKET = "casaensueno-files";
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** Extrae path del storage según tipos de URL de supabase (public / signed) */
function extractPathFromStorageUrl(url: string, bucket: string) {
  try {
    const u = new URL(url);
    // patrón de Supabase public url: /storage/v1/object/public/<bucket>/<path>
    const publicPrefix = `/storage/v1/object/public/${bucket}/`;
    const idx = u.pathname.indexOf(publicPrefix);
    if (idx !== -1) {
      return decodeURIComponent(u.pathname.slice(idx + publicPrefix.length));
    }
    // patrón posible de signed urls: /object/sign/<bucket>/
    const signPrefix = `/object/sign/${bucket}/`;
    const idx2 = u.pathname.indexOf(signPrefix);
    if (idx2 !== -1) {
      return decodeURIComponent(u.pathname.slice(idx2 + signPrefix.length));
    }
    // fallback: split por /<bucket>/
    const parts = u.pathname.split(`/${bucket}/`);
    if (parts.length > 1) return decodeURIComponent(parts[1]);
    return null;
  } catch {
    return null;
  }
}

export async function GET(request: Request) {
  const admin = createAdminClient();
  try {
    const url = new URL(request.url);
    const searchParam = (url.searchParams.get("search") ?? "").trim();
    const categoryParam = url.searchParams.get("category");
    const availableParam = url.searchParams.get("available");

    // Resolver categoryParam -> categoryName (texto que está almacenado en products.category)
    let categoryName: string | null = null;
    if (categoryParam) {
      const raw = String(categoryParam).trim();
      if (raw) {
        if (uuidRegex.test(raw)) {
          // buscar por id (uuid)
          const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id", raw).maybeSingle();
          if (fErr) {
            console.error("[search] error looking up category by uuid:", fErr);
            return NextResponse.json({ error: "Error resolving category" }, { status: 500 });
          }
          if (found?.name) categoryName = found.name;
        } else if (/^\d+$/.test(raw)) {
          // buscar por id_int
          const idInt = Number(raw);
          const { data: found, error: fErr } = await admin.from("categories").select("name").eq("id_int", idInt).maybeSingle();
          if (fErr) {
            console.error("[search] error looking up category by id_int:", fErr);
            return NextResponse.json({ error: "Error resolving category" }, { status: 500 });
          }
          if (found?.name) categoryName = found.name;
        } else {
          // el cliente nos envió ya el nombre de la categoría
          categoryName = raw;
        }
      }
    }

    // Construir la consulta a products con filtros condicionales
    // Seleccionamos product_images para luego construir urls
    let query = admin
      .from("products")
      .select(
        `
        id,
        name,
        price,
        available,
        category,
        product_images (
          image_url,
          display_order
        )
      `
      )
      // mantenemos ordering de imágenes por display_order
      .order("display_order", { foreignTable: "product_images" });

    // Filtros:
    if (categoryName) {
      // usamos eq para igualdad exacta; si quieres coincidencia case-insensitive usa .ilike
      query = query.eq("category", categoryName);
    }

    if (availableParam === "1" || availableParam?.toLowerCase() === "true") {
      query = query.eq("available", true);
    }

    if (searchParam) {
      // buscamos en name o description (case-insensitive partial match)
      // Supabase permite usar .or con condiciones ilike
      const term = `%${searchParam}%`;
      // `.or` aplica sobre la tabla principal; si ya hay eq's encadenadas siguen funcionando.
      query = query.or(`name.ilike.${term},description.ilike.${term}`);
    }

    const { data: products, error } = await query;
    if (error) {
      console.error("[search] supabase error:", error);
      return NextResponse.json({ error: error.message ?? "Error fetching products" }, { status: 500 });
    }

    // Enriquecer imágenes -> intentar publicUrl, si no signedUrl, fallback null
    const enriched = await Promise.all(
      (products || []).map(async (p: any) => {
        const imgs =
          p.product_images?.length > 0
            ? await Promise.all(
                p.product_images.map(async (pi: any) => {
                  if (!pi?.image_url) return null;
                  try {
                    // si es ya una URL completa, retornarla tal cual
                    if (pi.image_url.startsWith("http")) return pi.image_url;
                    // intentamos public url
                    try {
                      const { data: pub } = admin.storage.from(BUCKET).getPublicUrl(pi.image_url);
                      if (pub?.publicUrl) return pub.publicUrl;
                    } catch {}
                    // intentamos signed url (1h)
                    try {
                      const { data: signed } = await admin.storage.from(BUCKET).createSignedUrl(pi.image_url, 60 * 60);
                      if (signed?.signedUrl) return signed.signedUrl;
                    } catch {}
                  } catch (e) {
                    console.error("[search] image processing error:", e);
                  }
                  return null;
                }),
              )
            : [];
        return {
          ...p,
          images: (imgs || []).filter(Boolean),
        };
      }),
    );

    return NextResponse.json({ products: enriched });
  } catch (err: any) {
    console.error("[search] unexpected error:", err);
    return NextResponse.json({ error: err?.message ?? "unexpected error" }, { status: 500 });
  }
}

// app/api/products/search/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ZERO_UUID = "00000000-0000-0000-0000-000000000000";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const categoryRaw = url.searchParams.get("category") ?? "";
    const search = url.searchParams.get("search") ?? "";
    const admin = createAdminClient();

    // Fetch categories map (id_int -> uuid) to resolve numeric filters
    const { data: categoriesRaw, error: catErr } = await admin.from("categories").select("id,id_int");
    if (catErr) {
      console.error("[api/products/search] categories fetch error:", catErr);
      return NextResponse.json({ error: "Error fetching categories" }, { status: 500 });
    }
    const intToUuid = new Map<number, string>();
    (categoriesRaw || []).forEach((c: any) => {
      if (typeof c.id_int === "number" && c.id) intToUuid.set(c.id_int, c.id);
    });

    // Build select strings (same logic que en server)
    const selectWithCats = `
      id,
      name,
      price,
      available,
      product_images(image_url),
      product_categories(category_id)
    `;
    const selectWithInnerCats = `
      id,
      name,
      price,
      available,
      product_images(image_url),
      product_categories!inner(category_id)
    `;

    let query = admin.from("products").select(selectWithCats).eq("available", true).order("created_at", { ascending: false });

    // If category filter provided, resolve it (id_int or uuid) and use !inner
    if (categoryRaw && categoryRaw.trim() !== "") {
      const raw = String(categoryRaw).trim();
      let catFilterUuid: string | null = null;

      const maybeNum = Number(raw);
      if (!Number.isNaN(maybeNum) && Number.isInteger(maybeNum)) {
        const resolved = intToUuid.get(maybeNum);
        catFilterUuid = resolved ?? ZERO_UUID;
      } else if (uuidRegex.test(raw)) {
        catFilterUuid = raw;
      } else {
        catFilterUuid = ZERO_UUID;
      }

      query = admin
        .from("products")
        .select(selectWithInnerCats)
        .eq("available", true)
        .eq("product_categories.category_id", catFilterUuid)
        .order("created_at", { ascending: false });
    }

    if (search && search.trim() !== "") {
      // apply ilike on name
      query = query.ilike("name", `%${search.trim()}%`);
    }

    const result = await query;
    if (result.error) {
      console.error("[api/products/search] query error:", result.error);
      return NextResponse.json({ error: result.error.message || "Query error" }, { status: 500 });
    }

    const productsRaw = result.data || [];

    const products = (productsRaw || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      price: typeof p.price === "number" ? p.price : Number(p.price ?? 0),
      available: !!p.available,
      images: (p.product_images || []).map((img: any) => img?.image_url).filter(Boolean) || [],
      category:
        p.product_categories && p.product_categories.length > 0 ? String(p.product_categories[0].category_id) : null,
    }));

    return NextResponse.json({ products }, { status: 200 });
  } catch (err: unknown) {
    console.error("[api/products/search] unexpected:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

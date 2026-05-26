// app/api/products/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { cookies } from "next/headers";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const BUCKET = "casaensueno files"; // nombre del bucket con espacio

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
 * Si no hay onlyCategories, devuelve todos los productos.
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const onlyCategories = url.searchParams.get("onlyCategories");

    if (onlyCategories) {
      // Obtener categorías únicas desde products (global)
      const result = await query('SELECT DISTINCT category FROM products WHERE category IS NOT NULL');
      const cats = result.rows.map((r: any) => String(r.category || "").trim()).filter(Boolean);
      const unique = Array.from(new Set(cats));
      return NextResponse.json({ categories: unique }, { status: 200 });
    }

    // Devolver todos los productos (sin filtrar por usuario)
    const result = await query('SELECT * FROM products ORDER BY created_at DESC');
    return NextResponse.json(result.rows ?? [], { status: 200 });
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
    // Verificar sesión de admin usando cookies
    const cookieStore = await cookies();
    const session = cookieStore.get('admin-session');

    if (!session?.value) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, category, images } = body ?? {};

    if (!name || !category || typeof category !== "string" || !String(category).trim()) {
      return NextResponse.json({ error: "Missing required fields: name y category" }, { status: 400 });
    }

    const rawCat = String(category).trim();
    let categoryName: string | null = null;
    
    // Usar el nombre de categoría directamente (no hay tabla categories)
    categoryName = rawCat;

    if (!categoryName) return NextResponse.json({ error: "Invalid category" }, { status: 400 });

    const productResult = await query(
      'INSERT INTO products (name, description, price, available, category) VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [name, description, Number.parseFloat(price ?? 0), !!available, categoryName]
    );

    const product = productResult.rows[0];

    // manejar imágenes
    if (Array.isArray(images) && images.length) {
      const imageRecords: { product_id: string; image_url: string; display_order?: number; size?: number }[] = [];

      for (const img of images) {
        if (!img) continue;
        if (img.path && typeof img.path === "string") {
          imageRecords.push({ 
            product_id: product.id, 
            image_url: img.path, 
            display_order: img.display_order ?? 0,
            size: img.size ?? null
          });
        } else if (typeof img === "string") {
          imageRecords.push({ product_id: product.id, image_url: img, display_order: 0 });
        }
      }

      if (imageRecords.length) {
        for (const img of imageRecords) {
          await query(
            'INSERT INTO product_images (product_id, image_url, display_order, size) VALUES ($1, $2, $3, $4)',
            [img.product_id, img.image_url, img.display_order, img.size]
          );
        }
      }
    }

    return NextResponse.json(product, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create product";
    console.error("[product-create] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

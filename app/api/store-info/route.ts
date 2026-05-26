// app/api/store-info/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Deshabilitar caché para esta ruta
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await query(
      'SELECT * FROM store_info ORDER BY updated_at DESC LIMIT 1'
    );

    const row = result.rows.length > 0 ? result.rows[0] : null;
    return NextResponse.json(row ?? {}, { status: 200 });
  } catch (err) {
    console.error("[GET /api/store-info] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

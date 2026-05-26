// app/api/store-whatsapp/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";

// Deshabilitar caché para esta ruta
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET() {
  try {
    const result = await query(
      'SELECT id, name, phone, store_id, created_at, updated_at FROM store_whatsapp_contacts ORDER BY created_at ASC'
    );

    return NextResponse.json(result.rows ?? [], { status: 200 });
  } catch (err) {
    console.error("[GET /api/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

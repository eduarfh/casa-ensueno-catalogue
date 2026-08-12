// app/api/admin/save-store/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

type StoreInfoRow = {
  id?: string | null;
  label?: string | null;
  phone_display?: string | null;
  whatsapp_number?: string | null;
  address?: string | null;
  lat?: string | null;
  lng?: string | null;
  hours?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
};

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    
    // 1) Leer la fila existente (si existe)
    const selectSql = `
      SELECT * FROM store_info 
      ORDER BY updated_at DESC 
      LIMIT 1
    `;
    
    const selectResult = await query(selectSql);
    const existingData = selectResult.rows[0];

    let resultRow: StoreInfoRow | null = null;

    if (existingData && existingData.id) {
      // 2a) UPDATE por id y devolver la fila actualizada
      console.log("[POST /api/admin/save-store] Updating existing row with id:", existingData.id);
      
      const updateSql = `
        UPDATE store_info 
        SET 
          label = $1,
          phone_display = $2,
          whatsapp_number = $3,
          address = $4,
          lat = $5,
          lng = $6,
          hours = $7,
          updated_at = NOW()
        WHERE id = $8
        RETURNING *
      `;
      
      const updateResult = await query(updateSql, [
        body.label ?? null,
        body.phone_display ?? null,
        body.whatsapp_number ?? null,
        body.address ?? null,
        body.lat ?? null,
        body.lng ?? null,
        body.hours ?? null,
        existingData.id
      ]);

      resultRow = updateResult.rows[0] as StoreInfoRow;
      console.log("[POST /api/admin/save-store] Updated successfully:", resultRow);
    } else {
      // 2b) INSERT y devolver la fila insertada
      console.log("[POST /api/admin/save-store] Inserting new row");
      
      const insertSql = `
        INSERT INTO store_info (label, phone_display, whatsapp_number, address, lat, lng, hours)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        RETURNING *
      `;
      
      const insertResult = await query(insertSql, [
        body.label ?? null,
        body.phone_display ?? null,
        body.whatsapp_number ?? null,
        body.address ?? null,
        body.lat ?? null,
        body.lng ?? null,
        body.hours ?? null
      ]);

      resultRow = insertResult.rows[0] as StoreInfoRow;
      console.log("[POST /api/admin/save-store] Inserted successfully:", resultRow);
    }

    // Revalidar las rutas que usan store-info
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/api/store-info");

    return NextResponse.json(resultRow ?? {}, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/save-store] unexpected:", err);
    return NextResponse.json({ error: "unexpected", details: String(err) }, { status: 500 });
  }
}

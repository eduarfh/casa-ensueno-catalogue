// app/api/admin/save-store/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
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
    
    // Preparar payload con updated_at explícito
    const payload: Partial<StoreInfoRow> = {
      label: body.label ?? null,
      phone_display: body.phone_display ?? null,
      whatsapp_number: body.whatsapp_number ?? null,
      address: body.address ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      hours: body.hours ?? null,
      updated_at: new Date().toISOString(), // Forzar actualización del timestamp
    };

    const admin = createAdminClient();

    // 1) Leer la fila existente (si existe)
    const { data: existingData, error: readErr } = await admin
      .from("store_info")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1)
      .single();

    if (readErr && readErr.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error("[POST /api/admin/save-store] read error:", readErr);
      return NextResponse.json({ error: "DB read error", details: readErr }, { status: 500 });
    }

    let resultRow: StoreInfoRow | null = null;

    if (existingData && existingData.id) {
      // 2a) UPDATE por id y devolver la fila actualizada
      console.log("[POST /api/admin/save-store] Updating existing row with id:", existingData.id);
      
      const { data: updatedData, error: updateErr } = await admin
        .from("store_info")
        .update(payload)
        .eq("id", existingData.id)
        .select("*")
        .single();

      if (updateErr) {
        console.error("[POST /api/admin/save-store] update error:", updateErr);
        return NextResponse.json({ error: "DB update error", details: updateErr }, { status: 500 });
      }

      resultRow = updatedData as StoreInfoRow;
      console.log("[POST /api/admin/save-store] Updated successfully:", resultRow);
    } else {
      // 2b) INSERT y devolver la fila insertada
      console.log("[POST /api/admin/save-store] Inserting new row");
      
      const { data: insertedData, error: insertErr } = await admin
        .from("store_info")
        .insert(payload)
        .select("*")
        .single();

      if (insertErr) {
        console.error("[POST /api/admin/save-store] insert error:", insertErr);
        return NextResponse.json({ error: "DB insert error", details: insertErr }, { status: 500 });
      }

      resultRow = insertedData as StoreInfoRow;
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

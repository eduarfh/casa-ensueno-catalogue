// app/api/admin/save-store/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

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
    const payload: Partial<StoreInfoRow> = {
      label: body.label ?? null,
      phone_display: body.phone_display ?? null,
      whatsapp_number: body.whatsapp_number ?? null,
      address: body.address ?? null,
      lat: body.lat ?? null,
      lng: body.lng ?? null,
      hours: body.hours ?? null,
    };

    const admin = createAdminClient();

    // 1) Leer la fila existente (si existe). No usamos generics para evitar problemas de tipado.
    const readResp = await admin.from("store_info").select("*").order("updated_at", { ascending: false }).limit(1);
    const existingArrRaw = (readResp as any).data;
    const readErr = (readResp as any).error;

    if (readErr) {
      console.error("[POST /api/admin/save-store] read error:", readErr);
      return NextResponse.json({ error: "DB read error" }, { status: 500 });
    }

    const existing = Array.isArray(existingArrRaw) && existingArrRaw.length > 0 ? (existingArrRaw[0] as StoreInfoRow) : null;

    let resultRow: StoreInfoRow | null = null;

    if (existing && existing.id) {
      // 2a) UPDATE por id y devolver la fila actualizada
      const updateResp = await admin.from("store_info").update(payload).eq("id", existing.id).select("*");
      const updatedDataRaw = (updateResp as any).data;
      const updateErr = (updateResp as any).error;

      if (updateErr) {
        console.error("[POST /api/admin/save-store] update error:", updateErr);
        return NextResponse.json({ error: "DB update error" }, { status: 500 });
      }

      resultRow = Array.isArray(updatedDataRaw) && updatedDataRaw.length ? (updatedDataRaw[0] as StoreInfoRow) : null;
    } else {
      // 2b) INSERT y devolver la fila insertada
      const insertResp = await admin.from("store_info").insert(payload).select("*");
      const insertedDataRaw = (insertResp as any).data;
      const insertErr = (insertResp as any).error;

      if (insertErr) {
        console.error("[POST /api/admin/save-store] insert error:", insertErr);
        return NextResponse.json({ error: "DB insert error" }, { status: 500 });
      }

      resultRow = Array.isArray(insertedDataRaw) && insertedDataRaw.length ? (insertedDataRaw[0] as StoreInfoRow) : null;
    }

    return NextResponse.json(resultRow ?? {}, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/save-store] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

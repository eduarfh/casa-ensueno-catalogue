// app/api/admin/store-whatsapp/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = {
      store_id: body.store_id ?? null,
      name: (body.name ?? "").toString().trim(),
      phone: (body.phone ?? "").toString().replace(/\D/g, ""),
    };
    if (!payload.name || !payload.phone) {
      return NextResponse.json({ error: "name & phone required" }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("store_whatsapp_contacts")
      .insert(payload)
      .select("*");

    if (error) {
      console.error("[POST /api/admin/store-whatsapp] insert error:", error);
      return NextResponse.json({ error: "DB insert error" }, { status: 500 });
    }
    return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const payload: any = {};
    if (body.name !== undefined) payload.name = String(body.name).trim();
    if (body.phone !== undefined) payload.phone = String(body.phone).replace(/\D/g, "");
    if (Object.keys(payload).length === 0) return NextResponse.json({ error: "nothing to update" }, { status: 400 });

    const admin = createAdminClient();
    const { data, error } = await admin
      .from("store_whatsapp_contacts")
      .update(payload)
      .eq("id", id)
      .select("*");

    if (error) {
      console.error("[PATCH /api/admin/store-whatsapp] update error:", error);
      return NextResponse.json({ error: "DB update error" }, { status: 500 });
    }
    return NextResponse.json(Array.isArray(data) ? data[0] : data, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const admin = createAdminClient();
    const { error } = await admin.from("store_whatsapp_contacts").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/store-whatsapp] delete error:", error);
      return NextResponse.json({ error: "DB delete error" }, { status: 500 });
    }
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

// app/api/admin/store-whatsapp/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const payload = {
      store_id: body.store_id ?? null,
      name: (body.name ?? "").toString().trim(),
      phone: (body.phone ?? "").toString().replace(/\D/g, ""),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    if (!payload.name || !payload.phone) {
      return NextResponse.json({ error: "name & phone required" }, { status: 400 });
    }

    const admin = createAdminClient();
    
    console.log("[POST /api/admin/store-whatsapp] Creating contact:", payload);
    
    const { data, error } = await admin
      .from("store_whatsapp_contacts")
      .insert(payload)
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/admin/store-whatsapp] insert error:", error);
      return NextResponse.json({ error: "DB insert error", details: error }, { status: 500 });
    }
    
    console.log("[POST /api/admin/store-whatsapp] Created successfully:", data);
    
    // Revalidar rutas
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/api/store-whatsapp");
    
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[POST /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected", details: String(err) }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const payload: any = {
      updated_at: new Date().toISOString(), // Forzar actualización del timestamp
    };
    
    if (body.name !== undefined) payload.name = String(body.name).trim();
    if (body.phone !== undefined) payload.phone = String(body.phone).replace(/\D/g, "");
    
    if (!payload.name && !payload.phone) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }

    const admin = createAdminClient();
    
    console.log("[PATCH /api/admin/store-whatsapp] Updating contact:", id, payload);
    
    const { data, error } = await admin
      .from("store_whatsapp_contacts")
      .update(payload)
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PATCH /api/admin/store-whatsapp] update error:", error);
      return NextResponse.json({ error: "DB update error", details: error }, { status: 500 });
    }
    
    console.log("[PATCH /api/admin/store-whatsapp] Updated successfully:", data);
    
    return NextResponse.json(data, { status: 200 });
  } catch (err) {
    console.error("[PATCH /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected", details: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const id = body.id;
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

    const admin = createAdminClient();
    
    console.log("[DELETE /api/admin/store-whatsapp] Deleting contact:", id);
    
    const { error } = await admin.from("store_whatsapp_contacts").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/store-whatsapp] delete error:", error);
      return NextResponse.json({ error: "DB delete error", details: error }, { status: 500 });
    }
    
    console.log("[DELETE /api/admin/store-whatsapp] Deleted successfully");
    
    // Revalidar rutas
    revalidatePath("/");
    revalidatePath("/catalog");
    revalidatePath("/api/store-whatsapp");
    
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch (err) {
    console.error("[DELETE /api/admin/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected", details: String(err) }, { status: 500 });
  }
}

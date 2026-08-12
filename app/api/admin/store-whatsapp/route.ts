// app/api/admin/store-whatsapp/route.ts
import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const name = (body.name ?? "").toString().trim();
    const phone = (body.phone ?? "").toString().replace(/\D/g, "");
    const store_id = body.store_id ?? null;
    
    if (!name || !phone) {
      return NextResponse.json({ error: "name & phone required" }, { status: 400 });
    }
    
    console.log("[POST /api/admin/store-whatsapp] Creating contact:", { name, phone, store_id });
    
    const insertSql = `
      INSERT INTO store_whatsapp_contacts (store_id, name, phone)
      VALUES ($1, $2, $3)
      RETURNING *
    `;
    
    const result = await query(insertSql, [store_id, name, phone]);
    const data = result.rows[0];
    
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

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;
    
    if (body.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(String(body.name).trim());
    }
    if (body.phone !== undefined) {
      updates.push(`phone = $${paramIndex++}`);
      values.push(String(body.phone).replace(/\D/g, ""));
    }
    
    if (updates.length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }
    
    updates.push(`updated_at = NOW()`);
    values.push(id);
    
    console.log("[PATCH /api/admin/store-whatsapp] Updating contact:", id);
    
    const updateSql = `
      UPDATE store_whatsapp_contacts 
      SET ${updates.join(', ')}
      WHERE id = $${paramIndex}
      RETURNING *
    `;
    
    const result = await query(updateSql, values);
    const data = result.rows[0];
    
    if (!data) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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
    
    console.log("[DELETE /api/admin/store-whatsapp] Deleting contact:", id);
    
    const deleteSql = `
      DELETE FROM store_whatsapp_contacts 
      WHERE id = $1
      RETURNING *
    `;
    
    const result = await query(deleteSql, [id]);
    
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Contact not found" }, { status: 404 });
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

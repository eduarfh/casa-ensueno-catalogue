// app/api/products/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

type ParamsShape = { id: string } | Promise<{ id: string }>;
const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function PUT(request: Request, { params }: { params: ParamsShape }) {
  try {
    // params puede ser una Promise en Next 16; await para desempaquetar
    const { id: productId } = (await params) as { id: string };

    if (!productId) {
      return NextResponse.json({ error: "Missing product id" }, { status: 400 });
    }

    // Necesitamos leer la sesión del request (cookies HTTP-only)
    const supabase = await createServerClient({ allowSetCookies: true });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[products/:id/PUT] auth.getUser error:", userErr);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }
    const user = userData?.user ?? null;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Verificar permiso (ejemplo: usuario admin en admin_users)
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr) {
      console.error("[products/:id/PUT] admin lookup error:", adminErr);
      return NextResponse.json({ error: "Error checking admin", details: adminErr.message }, { status: 500 });
    }
    if (!adminRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // parse body
    const body = await request.json().catch(() => ({}));
    const { name, description, price, available, categories } = body ?? {};

    // validate minimal payload
    if (!name && description === undefined && price === undefined && available === undefined && !Array.isArray(categories)) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Build update payload only with provided fields
    const updatePayload: Record<string, any> = {};
    if (typeof name === "string") updatePayload.name = name;
    if (typeof description === "string") updatePayload.description = description;
    if (price !== undefined && price !== null) updatePayload.price = price;
    if (available !== undefined && available !== null) updatePayload.available = available;

    // Update product row if there are fields
    if (Object.keys(updatePayload).length > 0) {
      const { error: updErr } = await admin.from("products").update(updatePayload).eq("id", productId);
      if (updErr) {
        console.error("[products/:id/PUT] update product error:", updErr);
        return NextResponse.json({ error: "Error updating product", details: updErr.message }, { status: 500 });
      }
    }

    // Sync categories relation if provided (categories expected as array of category UUIDs or id_int)
    if (Array.isArray(categories)) {
      // Primero eliminar las asociaciones previas
      const { error: delErr } = await admin.from("product_categories").delete().eq("product_id", productId);
      if (delErr) {
        console.error("[products/:id/PUT] delete product_categories error:", delErr);
        return NextResponse.json({ error: "Error clearing previous categories", details: delErr.message }, { status: 500 });
      }

      // Insertar nuevas asociaciones (si hay)
      if (categories.length > 0) {
        // Separate id_int vs uuids
        const idIntList: number[] = [];
        const uuidList: string[] = [];
        for (const cat of categories) {
          const s = String(cat).trim();
          if (/^\d+$/.test(s)) idIntList.push(Number(s));
          else if (uuidRegex.test(s)) uuidList.push(s);
          else {
            return NextResponse.json({ error: `Invalid category identifier: ${s}` }, { status: 400 });
          }
        }

        // Resolve id_int to uuid if needed
        const resolvedUuidMap: Record<number, string> = {};
        if (idIntList.length) {
          const { data: found, error: fErr } = await admin
            .from("categories")
            .select("id,id_int")
            .in("id_int", idIntList);
          if (fErr) {
            console.error("[products/:id/PUT] lookup categories by id_int error:", fErr);
            return NextResponse.json({ error: "Error resolving category ids", details: fErr.message }, { status: 500 });
          }
          (found || []).forEach((r: any) => {
            if (typeof r.id_int === "number" && r.id) resolvedUuidMap[r.id_int] = r.id;
          });

          const missing = idIntList.filter((i) => !resolvedUuidMap[i]);
          if (missing.length) {
            return NextResponse.json({ error: `No se encontró categoría(s) con id_int: ${missing.join(", ")}` }, { status: 400 });
          }
        }

        const toInsert = [
          ...uuidList.map((u) => ({ product_id: productId, category_id: u })),
          ...idIntList.map((i) => ({ product_id: productId, category_id: resolvedUuidMap[i] })),
        ];

        if (toInsert.length) {
          const { error: insErr } = await admin.from("product_categories").insert(toInsert);
          if (insErr) {
            console.error("[products/:id/PUT] insert product_categories error:", insErr);
            return NextResponse.json({ error: "Error inserting categories", details: insErr.message }, { status: 500 });
          }
        }
      }
    }

    return NextResponse.json({ ok: true, productId }, { status: 200 });
  } catch (err: unknown) {
    console.error("[products/:id/PUT] unexpected error:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

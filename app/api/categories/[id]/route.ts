// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

/**
 * DELETE: acepta tanto /categories/123 (id_int) como /categories/<uuid>
 * - Si recibe entero (solo dígitos), lo trata como id_int.
 * - Si recibe uuid, busca el row para conocer su id_int y uuid.
 */
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: rawId } = params ?? {};
    if (!rawId) return NextResponse.json({ error: "Missing category id" }, { status: 400 });

    const supabase = await createServerClient();

    // validar sesión
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[categories-delete] auth.getUser error:", userErr);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verificar admin (si tu proyecto usa otra tabla/col, adáptalo)
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (adminErr) {
      console.error("[categories-delete] admin lookup error:", adminErr);
      return NextResponse.json({ error: "Error checking admin", details: adminErr.message }, { status: 500 });
    }
    if (!adminRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();

    // decidir si rawId es integer (id_int) o uuid
    const isInt = /^\d+$/.test(rawId);

    let targetIdInt: number | null = null;
    let targetUuid: string | null = null;

    if (isInt) {
      targetIdInt = Number(rawId);
      // buscar uuid para ese id_int (por si existe)
      const { data: found, error: fErr } = await admin.from("categories").select("id").eq("id_int", targetIdInt).single();
      if (fErr) {
        if (fErr.code === "PGRST116" || fErr.details?.includes("No rows found")) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        console.error("[categories-delete] lookup by id_int error:", fErr);
        return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
      }
      targetUuid = found?.id ?? null;
    } else {
      // rawId parece uuid -> obtener fila
      const { data: found, error: fErr } = await admin.from("categories").select("id,id_int").eq("id", rawId).single();
      if (fErr) {
        if (fErr.code === "PGRST116" || fErr.details?.includes("No rows found")) {
          return NextResponse.json({ error: "Category not found" }, { status: 404 });
        }
        console.error("[categories-delete] lookup by uuid error:", fErr);
        return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
      }
      targetUuid = found?.id ?? null;
      targetIdInt = typeof found?.id_int === "number" ? found.id_int : null;
    }

    if (!targetUuid || targetIdInt === null) {
      return NextResponse.json({ error: "Category not found or missing id_int" }, { status: 404 });
    }

    // comprobar si la categoría está asociada a productos (product_categories.category_id es integer)
    const { data: used, error: usedErr } = await admin
      .from("product_categories")
      .select("product_id")
      .eq("category_id", targetIdInt)
      .limit(1);

    if (usedErr) {
      console.error("[categories-delete] check association error:", usedErr);
      return NextResponse.json({ error: "Error checking category usage", details: usedErr.message }, { status: 500 });
    }

    if (used && Array.isArray(used) && used.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category: it is associated with one or more products. Remove associations first." },
        { status: 400 },
      );
    }

    // borrar categoría (service role) por UUID
    const { error: delErr } = await admin.from("categories").delete().eq("id", targetUuid);

    if (delErr) {
      console.error("[categories-delete] delete error:", delErr);
      return NextResponse.json({ error: "Error deleting category", details: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[categories-delete] unexpected error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

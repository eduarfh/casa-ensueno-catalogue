// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params ?? {};
    if (!id) return NextResponse.json({ error: "Missing category id" }, { status: 400 });

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

    // usa admin client para las operaciones de manipulación
    const admin = createAdminClient();

    // comprobar si la categoría está asociada a productos
    const { data: used, error: usedErr } = await admin
      .from("product_categories")
      .select("product_id")
      .eq("category_id", id)
      .limit(1);

    if (usedErr) {
      console.error("[categories-delete] check association error:", usedErr);
      return NextResponse.json({ error: "Error checking category usage", details: usedErr.message }, { status: 500 });
    }

    if (used && (Array.isArray(used) ? used.length > 0 : Boolean(used.product_id))) {
      return NextResponse.json(
        { error: "Cannot delete category: it is associated with one or more products. Remove associations first." },
        { status: 400 },
      );
    }

    // borrar categoría (service role)
    const { error: delErr } = await admin.from("categories").delete().eq("id", id);

    if (delErr) {
      console.error("[categories-delete] delete error:", delErr);
      return NextResponse.json({ error: "Error deleting category", details: delErr.message }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown server error";
    console.error("[categories-delete] unexpected error:", err);
    // siempre devolver JSON
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

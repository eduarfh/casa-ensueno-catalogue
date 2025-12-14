// app/api/categories/[id]/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!id) return NextResponse.json({ error: "Missing category id" }, { status: 400 });

    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verificar admin
    const { data: adminRow } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single();
    if (!adminRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const admin = createAdminClient();

    // comprobar si la categoría está asociada a productos
    const { data: used, error: usedErr } = await admin
      .from("product_categories")
      .select("product_id")
      .eq("category_id", id)
      .limit(1);

    if (usedErr) {
      console.error("[categories-delete] check association error:", usedErr);
      return NextResponse.json({ error: usedErr.message || "Error checking category usage" }, { status: 500 });
    }

    if (used && used.length > 0) {
      return NextResponse.json(
        { error: "Cannot delete category: it is associated with one or more products. Remove associations first." },
        { status: 400 },
      );
    }

    // borrar categoría
    const { error: delErr } = await admin.from("categories").delete().eq("id", id);

    if (delErr) {
      console.error("[categories-delete] delete error:", delErr);
      return NextResponse.json({ error: delErr.message || "Error deleting category" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error deleting category";
    console.error("[categories-delete] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

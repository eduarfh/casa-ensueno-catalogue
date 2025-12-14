// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verificar admin
    const { data: adminRow } = await supabase.from("admin_users").select("is_admin").eq("user_id", user.id).single();
    if (!adminRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'name' field" }, { status: 400 });
    }

    const admin = createAdminClient();

    // insertar categoría (la tabla categories tiene unique(name) por tu schema)
    const { data: category, error } = await admin
      .from("categories")
      .insert({ name: name.trim(), description: description ?? null })
      .select()
      .single();

    if (error) {
      // manejar unique constraint u otros errores
      console.error("[categories-create] error:", error);
      const message = (error?.message as string) || "Error creating category";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating category";
    console.error("[categories-create] ", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

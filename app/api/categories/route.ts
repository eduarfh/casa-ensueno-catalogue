// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient();
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[categories-create] auth.getUser error:", userErr);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // verificar admin
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    if (adminErr) {
      console.error("[categories-create] admin lookup error:", adminErr);
      return NextResponse.json({ error: "Error checking admin", details: adminErr.message }, { status: 500 });
    }
    if (!adminRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json();
    const { name, description } = body ?? {};

    if (!name || typeof name !== "string" || !name.trim()) {
      return NextResponse.json({ error: "Missing or invalid 'name' field" }, { status: 400 });
    }

    const admin = createAdminClient();

    // calcular next id_int (evita insertar NULL en id_int)
    const { data: lastRow, error: lastErr } = await admin
      .from("categories")
      .select("id_int")
      .order("id_int", { ascending: false })
      .limit(1)
      .single();

    if (lastErr && lastErr.code !== "PGRST116") {
      // PGRST116 occurs if no rows in some setups; still we want to continue
      console.warn("[categories-create] warning while retrieving last id_int:", lastErr);
    }

    const nextIdInt = lastRow && typeof lastRow.id_int === "number" ? lastRow.id_int + 1 : 1;

    // insertar categoría incluyendo id_int
    const { data: category, error } = await admin
      .from("categories")
      .insert({ id_int: nextIdInt, name: name.trim(), description: description ?? null })
      .select()
      .single();

    if (error) {
      // manejar unique constraint u otros errores
      console.error("[categories-create] error:", error);
      const message = (error?.message as string) || "Error creating category";
      // si es constraint unique devolver 400
      return NextResponse.json({ error: message }, { status: 400 });
    }

    return NextResponse.json(category, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating category";
    console.error("[categories-create] unexpected:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

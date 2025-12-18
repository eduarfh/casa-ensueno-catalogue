// app/api/categories/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const supabase = await createServerClient({ allowSetCookies: true });

    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[categories-create] auth.getUser error:", userErr);
      return NextResponse.json({ error: "Auth error" }, { status: 500 });
    }
    const user = userData?.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();
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

    // obtener next id_int
    const { data: lastRow } = await admin
      .from("categories")
      .select("id_int")
      .order("id_int", { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextIdInt = lastRow && typeof lastRow.id_int === "number" ? lastRow.id_int + 1 : 1;

    const { data: category, error } = await admin
      .from("categories")
      .insert({ id_int: nextIdInt, name: name.trim(), description: description ?? null })
      .select()
      .single();

    if (error) {
      console.error("[categories-create] error:", error);
      const message = (error?.message as string) || "Error creating category";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    // Normalize response: send uuid as id plus id_int for clients that need it
    const normalized = {
      id: category.id, // UUID
      uuid: category.id,
      id_int: category.id_int,
      name: category.name,
      description: category.description ?? null,
      created_at: category.created_at,
    };

    return NextResponse.json(normalized, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Error creating category";
    console.error("[categories-create] unexpected:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

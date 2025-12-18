// app/api/products/[id]/categories/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id: productId } = params ?? {};
    if (!productId) return NextResponse.json({ error: "Missing product id" }, { status: 400 });

    // require admin session server-side
    const supabase = await createServerClient({ allowSetCookies: true });
    const { data: userData, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.error("[product-cats] auth.getUser error:", userErr);
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
      console.error("[product-cats] admin lookup error:", adminErr);
      return NextResponse.json({ error: "Error checking admin", details: adminErr.message }, { status: 500 });
    }
    if (!adminRow?.is_admin) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await request.json().catch(() => ({}));
    const { category_id } = body ?? {};

    if (!category_id) {
      return NextResponse.json({ error: "Missing or invalid category_id" }, { status: 400 });
    }

    const admin = createAdminClient();

    const raw = String(category_id).trim();

    let resolvedUuid: string | null = null;

    if (uuidRegex.test(raw)) {
      resolvedUuid = raw;
    } else if (/^\d+$/.test(raw)) {
      // resolve numeric id_int -> uuid
      const idInt = Number(raw);
      const { data: found, error: fErr } = await admin.from("categories").select("id").eq("id_int", idInt).maybeSingle();
      if (fErr) {
        console.error("[product-cats] lookup by id_int error:", fErr);
        return NextResponse.json({ error: "Error looking up category", details: fErr.message }, { status: 500 });
      }
      if (!found?.id) {
        return NextResponse.json({ error: `Category with id_int ${idInt} not found` }, { status: 404 });
      }
      resolvedUuid = found.id;
    } else {
      return NextResponse.json({ error: "category_id must be a UUID or an id_int numeric string" }, { status: 400 });
    }

    // Insert relation (category_id is UUID, product_id is UUID)
    const { data: inserted, error } = await admin
      .from("product_categories")
      .insert({ product_id: productId, category_id: resolvedUuid })
      .select()
      .single();

    if (error) {
      console.error("[product-cats] insert error:", error);
      return NextResponse.json({ error: error.message || "Error associating category" }, { status: 500 });
    }

    return NextResponse.json({ ok: true, inserted }, { status: 201 });
  } catch (err: unknown) {
    console.error("[product-cats] unexpected:", err);
    const message = err instanceof Error ? err.message : "Unknown server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

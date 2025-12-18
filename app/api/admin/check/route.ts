// app/api/admin/check/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient({ allowSetCookies: true });

    const { data: userRes, error: userErr } = await supabase.auth.getUser();
    if (userErr) {
      console.warn("[/api/admin/check] supabase.auth.getUser error:", userErr);
      return NextResponse.json({ ok: false, isAdmin: false }, { status: 500 });
    }

    const user = (userRes as any)?.user ?? null;
    if (!user) {
      return NextResponse.json({ ok: false, isAdmin: false, user: null }, { status: 401 });
    }

    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .maybeSingle();

    if (adminErr) {
      console.warn("[/api/admin/check] admin lookup error:", adminErr);
      return NextResponse.json({ ok: false, isAdmin: false }, { status: 500 });
    }

    const isAdmin = !!adminRow?.is_admin;
    return NextResponse.json({ ok: true, isAdmin, user: { id: user.id, email: user.email } });
  } catch (err) {
    console.error("[/api/admin/check] unexpected:", err);
    return NextResponse.json({ ok: false, isAdmin: false, user: null }, { status: 500 });
  }
}

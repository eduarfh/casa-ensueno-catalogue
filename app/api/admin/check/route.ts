// app/api/admin/check/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return NextResponse.json({ isAdmin: false, user: null });

    const { data: adminRow } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    return NextResponse.json({ isAdmin: !!adminRow?.is_admin, user: { id: user.id, email: user.email } });
  } catch {
    return NextResponse.json({ isAdmin: false, user: null });
  }
}

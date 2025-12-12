// app/api/admin/registrations/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerClient();

    // get user from cookies
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check admin flag
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (adminErr || !adminRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // fetch pending registration requests
    const { data, error: fetchErr } = await supabase
      .from("registration_requests")
      .select("id, email, status, requested_at")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (fetchErr) {
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data || [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[registrations] exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

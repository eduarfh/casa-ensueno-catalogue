// app/api/admin/registrations/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function GET() {
  try {
    // 1) verifica sesión usando el server-bound client (usa cookies)
    const supabase = await createServerClient({ allowSetCookies: true });

    
    const {
      data: { user },
      error: userErr,
    } = await supabase.auth.getUser();

    if (userErr || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2) verifica que el usuario sea admin (usando el server client)
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (adminErr || !adminRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) usa el admin (service-role) client para leer registration_requests (bypassea RLS)
    const admin = createAdminClient();
    const { data, error: fetchErr } = await admin
      .from("registration_requests")
      .select("id, email, status, requested_at")
      .eq("status", "pending")
      .order("requested_at", { ascending: false });

    if (fetchErr) {
      console.error("[registrations] admin fetchErr:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    return NextResponse.json({ requests: data ?? [] }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[registrations] exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

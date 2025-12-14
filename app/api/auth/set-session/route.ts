// app/api/auth/set-session/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const body = await request.json().catch(() => ({}));
    const { access_token, refresh_token } = body ?? {};

    if (!access_token || !refresh_token) {
      return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
    }

    // createServerSupabase debe ser el helper server que respeta cookies (tu lib/supabase/server.ts)
    const supabase = await createServerSupabase();

    // setSession en server escribirá cookies sb-* en la respuesta
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token,
    });

    if (error) {
      console.error("[/api/auth/set-session] supabase.auth.setSession error:", error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/set-session] unexpected error:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

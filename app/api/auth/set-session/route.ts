// app/api/auth/set-session/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  try {
    console.log(`[set-session:${requestId}] start`);

    const body = await request.json().catch(() => ({}));
    const { access_token, refresh_token } = body ?? {};

    if (!access_token || !refresh_token) {
      console.warn(`[set-session:${requestId}] missing tokens`);
      return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    // Si el servidor ya ve un user, devolvemos ok y evitamos re-setear cookies.
    const existing = await supabase.auth.getUser().catch((e) => ({ error: e }));
    if (existing?.data?.user) {
      console.log(`[set-session:${requestId}] server already has user: ${existing.data.user.id}`);
      return NextResponse.json({ ok: true, user: existing.data.user });
    }

    // Intentamos setSession (esto pedirá a goTrue escribir cookies)
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) {
      console.error(`[set-session:${requestId}] supabase.auth.setSession error:`, error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    console.log(`[set-session:${requestId}] setSession ok; user id: ${data?.user?.id ?? "unknown"}`);

    // Para debug: devolvemos getUser para confirmar que el server lee sesión
    const userRes = await supabase.auth.getUser().catch((e) => ({ error: e }));
    return NextResponse.json({
      ok: true,
      user: userRes?.data?.user ?? null,
      getUserError: userRes?.error ? String(userRes.error) : null,
    });
  } catch (err) {
    console.error(`[set-session:${requestId}] unexpected error:`, err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

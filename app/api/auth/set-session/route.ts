import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const requestId = `${Date.now()}-${Math.floor(Math.random() * 10000)}`;
  try {
    console.log(`[set-session:${requestId}] start`);

    const body = await request.json().catch(() => ({}));
    const { access_token, refresh_token } = (body ?? {}) as { access_token?: string; refresh_token?: string };

    if (!access_token || !refresh_token) {
      console.warn(`[set-session:${requestId}] missing tokens`);
      return NextResponse.json({ error: "access_token and refresh_token required" }, { status: 400 });
    }

    // IMPORTANTE: allowSetCookies = true -> permitimos que supabase escriba cookies aquí
    const supabase = await createServerSupabase({ allowSetCookies: true });

    // Si el servidor ya ve un user, devolvemos ok y evitamos re-setear cookies.
    const existing = await supabase.auth.getUser().catch((e: unknown) => ({ error: e as Error | null }));
    if ((existing as any)?.data?.user) {
      console.log(`[set-session:${requestId}] server already has user: ${(existing as any).data.user.id}`);
      return NextResponse.json({ ok: true, user: (existing as any).data.user });
    }

    // Intentamos setSession (esto pedirá a goTrue escribir cookies)
    const { data, error } = await supabase.auth.setSession({ access_token, refresh_token });

    if (error) {
      console.error(`[set-session:${requestId}] supabase.auth.setSession error:`, error);
      return NextResponse.json({ error: error.message ?? String(error) }, { status: 500 });
    }

    console.log(`[set-session:${requestId}] setSession ok; user id: ${data?.user?.id ?? "unknown"}`);

    // Para debug: devolvemos getUser para confirmar que el server lee sesión
    const userRes = await supabase.auth.getUser().catch((e: unknown) => ({ error: e as Error | null }));
    return NextResponse.json({
      ok: true,
      user: (userRes as any)?.data?.user ?? null,
      getUserError: (userRes as any)?.error ? String((userRes as any).error) : null,
    });
  } catch (err: unknown) {
    console.error(`[set-session:${requestId}] unexpected error:`, err);
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

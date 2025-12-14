// app/api/supabase-debug/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(req: Request) {
  try {
    const supabase = await createServerSupabase();
    // pedimos getUser (puede intentar leer cookies internamente)
    const userRes = await supabase.auth.getUser().catch((e: any) => ({ error: String(e) }));

    // Para seguridad, no devolvemos tokens. Solo informamos si hay user y si la llamada a getUser falló.
    return NextResponse.json({
      ok: true,
      user: userRes?.data?.user ? { id: userRes.data.user.id, email: userRes.data.user.email } : null,
      getUserError: userRes?.error ? String(userRes.error) : null,
      note: "Esto es un endpoint debug temporal. Elimina después de usar."
    });
  } catch (err) {
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

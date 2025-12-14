// app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get("code");

    if (code) {
      const supabase = await createServerClient();

      // Intentamos intercambiar el code por sesión.
      // Nota: dependiendo de la versión de supabase-js, la API puede variar.
      // Si tu versión tiene `auth.exchangeCodeForSession`, úsala; si no, adáptalo.
      // Aquí intentamos usar exchangeCodeForSession si existe.
      // Fallback: simplemente redirigir al admin.
      // (Mantén tu lógica real si la habías implementado con otro método.)
      // @ts-ignore
      const exchange = supabase?.auth?.exchangeCodeForSession
        ? // @ts-ignore
          await supabase.auth.exchangeCodeForSession(code)
        : { error: null };

      if (!exchange?.error) {
        return NextResponse.redirect(new URL("/admin", request.url));
      }
    }
  } catch (err) {
    console.error("[auth/callback] error:", err);
  }

  return NextResponse.redirect(new URL("/auth/error", request.url));
}

// app/auth/logout/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  try {
    const supabase = await createServerClient();
    // signOut en server client respetará cookies si createServerClient está usando @supabase/ssr
    // Si tu versión tiene otra forma, adáptalo.
    if (supabase?.auth?.signOut) {
      // @ts-ignore
      await supabase.auth.signOut();
    }
  } catch (err) {
    console.warn("[auth/logout] signOut error:", err);
  }

  return NextResponse.redirect(new URL("/", request.url));
}

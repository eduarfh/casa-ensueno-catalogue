// app/api/auth/clear-session/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function POST() {
  try {
    const supabase = await createServerSupabase();

    // signOut server-side eliminará cookies asociadas
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.warn("[/api/auth/clear-session] signOut error:", error);
      return NextResponse.json({ ok: false, error: error.message ?? String(error) }, { status: 500 });
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[/api/auth/clear-session] unexpected:", err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}

// app/api/store-whatsapp/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase();
    const { data, error } = await supabase
      .from("store_whatsapp_contacts")
      .select("id, name, phone, store_id, created_at, updated_at")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[GET /api/store-whatsapp] supabase error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    return NextResponse.json(Array.isArray(data) ? data : [], { status: 200 });
  } catch (err) {
    console.error("[GET /api/store-whatsapp] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

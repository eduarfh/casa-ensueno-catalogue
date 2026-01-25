// app/api/store-info/route.ts
import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createServerSupabase(); // <-- tu helper
    const { data, error } = await supabase
      .from("store_info")
      .select("*")
      .order("updated_at", { ascending: false })
      .limit(1);

    if (error) {
      console.error("[GET /api/store-info] supabase error:", error);
      return NextResponse.json({ error: "DB error" }, { status: 500 });
    }

    const row = Array.isArray(data) && data.length ? data[0] : null;
    return NextResponse.json(row ?? {}, { status: 200 });
  } catch (err) {
    console.error("[GET /api/store-info] unexpected:", err);
    return NextResponse.json({ error: "unexpected" }, { status: 500 });
  }
}

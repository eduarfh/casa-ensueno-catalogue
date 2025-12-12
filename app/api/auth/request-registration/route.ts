// app/api/auth/request-registration/route.ts
import { NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 })
    }

    // admin client usa service role key (DEBE estar en env vars server-only)
    const admin = createAdminClient()

    // Inserción: si hay constraint de unique en email, esto fallará y lo manejamos
    const { data, error } = await admin.from("registration_requests").insert([
      {
        email,
        password_hash: password,
        status: "pending",
      },
    ])

    if (error) {
      // maneja errores comunes: unique violation, etc.
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error"
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

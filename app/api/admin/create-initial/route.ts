// app/api/admin/create-initial/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function POST(request: Request) {
  try {
    const admin = createAdminClient();

    // Check if there are existing admin_users
    const { data: existingAdmins, error: adminsErr } = await admin.from("admin_users").select("id").limit(1);

    if (adminsErr) {
      return NextResponse.json({ error: adminsErr.message }, { status: 500 });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return NextResponse.json({ error: "Initial admin already exists" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "email and password required" }, { status: 400 });
    }

    // create auth user confirmed
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createData?.user) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    // add to admin_users
    const { error: insertErr } = await admin.from("admin_users").insert([{ user_id: createData.user.id, is_admin: true }]);

    if (insertErr) {
      try {
        await admin.auth.admin.deleteUser(createData.user.id);
      } catch (e) {
        console.error("Rollback delete user failed", e);
      }
      return NextResponse.json({ error: insertErr.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: { id: createData.user.id, email: createData.user.email } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

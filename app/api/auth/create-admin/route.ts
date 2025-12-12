// app/api/auth/create-admin/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    const serverSupabase = await createServerClient();
    const { data: userData } = await serverSupabase.auth.getUser();
    const user = userData?.user;

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check if caller is admin
    const { data: adminData } = await serverSupabase.from("admin_users").select("is_admin").eq("user_id", user.id).single();

    if (!adminData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { email, password } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const admin = createAdminClient();

    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createData?.user) {
      return NextResponse.json({ error: "Failed to create user" }, { status: 500 });
    }

    // add to admin_users
    const { error: insertError } = await admin.from("admin_users").insert([{ user_id: createData.user.id, is_admin: true }]);

    if (insertError) {
      try {
        await admin.auth.admin.deleteUser(createData.user.id);
      } catch {
        // ignore
      }
      return NextResponse.json({ error: insertError.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, user: { id: createData.user.id, email: createData.user.email } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Internal server error";
    console.error("[auth/create-admin] exception:", error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

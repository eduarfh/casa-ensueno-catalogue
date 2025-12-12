// app/api/admin/approve/route.ts
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createServerClient } from "@/lib/supabase/server"; // server client for cookie auth

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return NextResponse.json({ error: "requestId required" }, { status: 400 });
    }

    // server client to check current user via cookies
    const serverSupabase = await createServerClient();
    const { data: userData } = await serverSupabase.auth.getUser();

    const user = userData?.user;
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // check admin_users table to ensure caller is admin
    const { data: adminCheck } = await serverSupabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();

    if (!adminCheck?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // admin client with service role to create auth user
    const admin = createAdminClient();

    // fetch registration request
    const { data: reqRow, error: fetchErr } = await admin
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();

    if (fetchErr || !reqRow) {
      return NextResponse.json({ error: fetchErr?.message || "Request not found" }, { status: 404 });
    }

    // Generate a temporary password if the request has none stored.
    // NOTE: we do NOT encourage storing plain passwords; here we support legacy scenarios.
    const password = reqRow.password_hash || Math.random().toString(36).slice(-12);

    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email: reqRow.email,
      password,
      email_confirm: true,
    });

    if (createError) {
      return NextResponse.json({ error: createError.message }, { status: 400 });
    }

    if (!createData?.user) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    const newUserId = createData.user.id;

    // insert into admin_users table
    const { error: insertAdminErr } = await admin
      .from("admin_users")
      .insert([{ user_id: newUserId, is_admin: true }]);

    if (insertAdminErr) {
      // attempt rollback of created auth user
      try {
        await admin.auth.admin.deleteUser(newUserId);
      } catch (e) {
        console.error("Rollback delete user failed", e);
      }
      return NextResponse.json({ error: insertAdminErr.message }, { status: 400 });
    }

    // update registration request status
    const { error: updateErr } = await admin
      .from("registration_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", requestId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 400 });
    }

    // don't return password; inform success
    return NextResponse.json({ success: true, user: { id: newUserId, email: createData.user.email } }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

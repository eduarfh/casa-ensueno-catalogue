// app/api/admin/registrations/approve/route.ts

import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { decryptPassword } from "@/lib/crypto";
import { sendEmail } from "@/lib/email";

type ReqBody = { requestId: string };

export async function POST(request: Request) {
  try {
    const body: ReqBody = await request.json();
    const { requestId } = body;
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    // 1) verify requester via cookies (server client)
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // 2) check admin flag using server cookie client (this obeys RLS)
    const { data: adminRow, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    if (adminErr || !adminRow?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // 3) fetch registration request row (use server supabase)
    const { data: requestRow, error: fetchErr } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (fetchErr || !requestRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const email = String(requestRow.email);
    const stored = requestRow.password_hash as string | null;

    // 4) derive plain password: try decrypt, else fallback to stored, else random
    let plainPassword = Math.random().toString(36).slice(-12);
    if (stored) {
      try {
        plainPassword = decryptPassword(stored);
      } catch {
        // if decrypt fails, assume stored might be plain or unusable; fallback to random
        plainPassword = stored.length > 0 ? stored : Math.random().toString(36).slice(-12);
      }
    }

    // 5) create auth user with service role client (admin client bypasses RLS)
    const admin = createAdminClient();
    // if user with this email already exists, we may want to link — attempt create, if fail and already exists, fetch by email
    const { data: createData, error: createError } = await admin.auth.admin.createUser({
      email,
      password: plainPassword,
      email_confirm: true,
    });

    let createdUserId: string | null = null;
    let createdEmail = email;

    if (createError) {
      // if user exists, try to find by email via admin RPC (list)
      // Note: Supabase admin API does not provide list-by-email in all SDKs; fallback: surface error unless it's "user already exists"
      // If the error indicates email already registered, try to find user via admin.auth.api.getUserByEmail (if available)
      // For portability, return a helpful error
      console.error("[approve] createUser error:", createError);
      return NextResponse.json({ error: createError.message || "Failed to create auth user" }, { status: 400 });
    }

    if (!createData?.user) {
      return NextResponse.json({ error: "Failed to create auth user" }, { status: 500 });
    }

    createdUserId = createData.user.id;
    createdEmail = createData.user.email ?? email;

    // 6) insert admin_users row
    const { error: insertAdminErr } = await admin.from("admin_users").insert([
      { user_id: createdUserId, is_admin: true },
    ]);
    if (insertAdminErr) {
      // rollback created auth user
      try {
        await admin.auth.admin.deleteUser(createdUserId);
      } catch (e) {
        console.warn("Rollback delete user failed", e);
      }
      return NextResponse.json({ error: insertAdminErr.message }, { status: 400 });
    }

    // 7) update registration_requests status (use server client so RLS applies)
    const { error: updateErr } = await supabase
      .from("registration_requests")
      .update({ status: "approved", reviewed_at: new Date().toISOString(), reviewed_by: user.id })
      .eq("id", requestId);

    if (updateErr) {
      console.warn("Failed to update registration_requests:", updateErr);
    }

    // 8) send approval email (best-effort)
    let mailResult: any = null;
    try {
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const loginUrl = `${siteUrl}/auth/login`;
      const html = `
        <p>Tu solicitud ha sido aprobada. Puedes iniciar sesión con tu correo.</p>
        <p>Email: <strong>${createdEmail}</strong></p>
        <p>Si no recuerdas la contraseña o quieres cambiarla, usa "Olvidé mi contraseña" en <a href="${loginUrl}">${loginUrl}</a>.</p>
      `;
      mailResult = await sendEmail({ to: createdEmail, subject: "Solicitud aprobada", html, text: `Tu solicitud fue aprobada. Inicia sesión en ${loginUrl}` });
    } catch (mailErr) {
      console.warn("[approve] failed to send approval email:", mailErr);
    }

    // 9) Return success. Do NOT return plaintext password in production.
    // In development, if using Ethereal, include previewUrl to inspect the email.
    return NextResponse.json({
      success: true,
      user: { id: createdUserId, email: createdEmail },
      emailPreview: mailResult?.previewUrl ?? null,
    }, { status: 201 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[approve] exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

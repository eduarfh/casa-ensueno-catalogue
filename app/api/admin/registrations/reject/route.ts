// app/api/admin/registrations/reject/route.ts
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email";

type ReqBody = { requestId: string; reason?: string | null };

export async function POST(request: Request) {
  try {
    const body: ReqBody = await request.json();
    const { requestId, reason } = body;
    if (!requestId) return NextResponse.json({ error: "requestId required" }, { status: 400 });

    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data: adminData, error: adminErr } = await supabase
      .from("admin_users")
      .select("is_admin")
      .eq("user_id", user.id)
      .single();
    if (adminErr || !adminData?.is_admin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // fetch registration request
    const { data: requestRow, error: fetchErr } = await supabase
      .from("registration_requests")
      .select("*")
      .eq("id", requestId)
      .single();
    if (fetchErr || !requestRow) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    const email = String(requestRow.email);

    // update to rejected
    const { error: updateErr } = await supabase
      .from("registration_requests")
      .update({
        status: "rejected",
        reviewed_at: new Date().toISOString(),
        reviewed_by: user.id,
        rejection_reason: reason ?? null,
      })
      .eq("id", requestId);

    if (updateErr) {
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // send rejection email (best-effort)
    let mailResult: any = null;
    try {
      const siteUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
      const html = `
        <p>Tu solicitud de cuenta como administrador ha sido <strong>rechazada</strong>.</p>
        ${reason ? `<p>Motivo: ${reason}</p>` : ""}
        <p>Si crees que esto es un error, contacta al administrador.</p>
      `;
      mailResult = await sendEmail({ to: email, subject: "Solicitud rechazada", html, text: `Tu solicitud ha sido rechazada. ${reason || ""}` });
    } catch (mailErr) {
      console.warn("[reject] failed to send email:", mailErr);
    }

    return NextResponse.json({ success: true, emailPreview: mailResult?.previewUrl ?? null }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal server error";
    console.error("[reject] exception:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

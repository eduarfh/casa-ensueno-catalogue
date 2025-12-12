// lib/email.ts
import nodemailer from "nodemailer";

type SendEmailOptions = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

type SendEmailResult = {
  success: boolean;
  messageId?: string;
  previewUrl?: string | null;
};

/**
 * Create a nodemailer transporter.
 * If SMTP env vars are present, use them.
 * Otherwise fallback to Ethereal (test account) automatically.
 */
async function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const secure = process.env.SMTP_SECURE === "true";

  if (host && port && user && pass) {
    // Production / configured SMTP transporter
    return nodemailer.createTransport({
      host,
      port,
      secure: !!secure,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback: Ethereal test account (development)
  // createTestAccount() is networked and creates a disposable inbox for previewing emails.
  const testAccount = await nodemailer.createTestAccount();
  const transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  // It's useful to log that we're using ethereal and show the test credentials (dev only)
  // (Do not log in production nor store credentials)
  // eslint-disable-next-line no-console
  console.info("[email] Using Ethereal test account. Preview inbox at https://ethereal.email/messages (emails only available for a short time).");

  return transporter;
}

/**
 * Send email with transporter; returns messageId and previewUrl (if available).
 */
export async function sendEmail(opts: SendEmailOptions): Promise<SendEmailResult> {
  try {
    const transporter = await createTransporter();
    const from = process.env.SMTP_FROM || `no-reply@${process.env.NEXT_PUBLIC_SITE_DOMAIN || "localhost"}`;

    const info = await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
      html: opts.html,
    });

    // nodemailer provides preview url for Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info) ?? null;

    // eslint-disable-next-line no-console
    console.info("[email] sent:", info.messageId, previewUrl ? `preview: ${previewUrl}` : "");

    return { success: true, messageId: info.messageId, previewUrl };
  } catch (err: unknown) {
    // eslint-disable-next-line no-console
    console.error("[email] send failed:", err);
    return { success: false };
  }
}

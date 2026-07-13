/**
 * Email utility — uses Resend when RESEND_API_KEY is set.
 * In development without the key, links are logged to the console instead.
 */

const BASE_URL = process.env.NEXTAUTH_URL ?? "http://localhost:5000";
const FROM = process.env.EMAIL_FROM ?? "Burch Platform <noreply@burch.africa>";
const HAS_RESEND = !!process.env.RESEND_API_KEY;

// ─── Dev-mode fallback ────────────────────────────────────────────────────────

function devLog(subject: string, url: string) {
  console.log("\n" + "─".repeat(60));
  console.log(`📧  [EMAIL — DEV MODE] ${subject}`);
  console.log(`🔗  ${url}`);
  console.log("─".repeat(60) + "\n");
}

// ─── HTML template ────────────────────────────────────────────────────────────

function emailWrapper(content: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f9fafb;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #e5e7eb;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#e85d04;">Burch</p>
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;background:#f9fafb;border-top:1px solid #e5e7eb;">
            <p style="margin:0;font-size:12px;color:#9ca3af;">
              Africa's AI-Powered Experience Platform
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function primaryButton(href: string, label: string): string {
  return `<a href="${href}" style="display:inline-block;background:#e85d04;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">${label}</a>`;
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  if (!HAS_RESEND) {
    devLog("Verify your Burch account", url);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Burch account",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Verify your email address</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Thanks for signing up! Click the button below to verify your email and activate your account.
      </p>
      ${primaryButton(url, "Verify email address")}
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Link expires in 24 hours.</p>
    `),
  });
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;

  if (!HAS_RESEND) {
    devLog("Reset your Burch password", url);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Burch password",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Reset your password</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      ${primaryButton(url, "Reset password")}
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Link expires in 1 hour.</p>
      <p style="margin:0;font-size:13px;color:#9ca3af;">If you didn't request this, ignore this email.</p>
    `),
  });
}

export { HAS_RESEND };

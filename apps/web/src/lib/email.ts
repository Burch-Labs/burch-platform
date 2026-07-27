/**
 * Email utility — uses Resend when RESEND_API_KEY is set.
 * In development without the key, links are logged to the console instead.
 */

/**
 * Resolve the canonical base URL for building links inside emails.
 *
 * Priority:
 *   1. NEXTAUTH_URL — explicit override (set this in the Replit production
 *      environment after the first publish if you need a stable value).
 *   2. REPLIT_DOMAINS — Replit automatically sets this to the deployment's
 *      public hostname(s); the first entry is the primary domain.  In
 *      production that is the *.replit.app URL; in the workspace dev shell it
 *      is the *.replit.dev preview URL.
 *   3. localhost:5000 — local fallback when neither env var is present.
 */
function resolveBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.REPLIT_DOMAINS) {
    const primary = process.env.REPLIT_DOMAINS.split(",")[0].trim();
    return `https://${primary}`;
  }
  return "http://localhost:5000";
}

const BASE_URL = resolveBaseUrl();
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

// ─── Partner booking notification ────────────────────────────────────────────

export interface PartnerBookingEmailParams {
  partnerEmail: string;
  partnerName: string;
  guestName: string;
  propertyName: string;
  propertyType: "hotel" | "restaurant";
  bookingDetail: string; // e.g. "Check-in: Jan 1 – Jan 3" or "2 guests on Jan 5 at 7:00 PM"
  dashboardUrl?: string;
}

export async function sendPartnerBookingNotification(
  params: PartnerBookingEmailParams
): Promise<void> {
  const {
    partnerEmail,
    partnerName,
    guestName,
    propertyName,
    propertyType,
    bookingDetail,
    dashboardUrl = `${BASE_URL}/partner/bookings`,
  } = params;

  const subject = `New ${propertyType === "hotel" ? "booking" : "reservation"} at ${propertyName}`;

  if (!HAS_RESEND) {
    devLog(subject, dashboardUrl);
    console.log(
      `  Guest: ${guestName} | Property: ${propertyName} | Detail: ${bookingDetail}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const typeLabel = propertyType === "hotel" ? "booking" : "reservation";

  await resend.emails.send({
    from: FROM,
    to: partnerEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">New ${typeLabel} request</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Hi ${partnerName}, you have a new ${typeLabel} waiting for your attention.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;width:40%;">Guest</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${guestName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Property</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${propertyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Details</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${bookingDetail}</td>
        </tr>
      </table>
      ${primaryButton(dashboardUrl, "View on dashboard")}
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">Log in to confirm or manage this ${typeLabel}.</p>
    `),
  });
}

// ─── Guest booking confirmation ───────────────────────────────────────────────

export interface GuestHotelConfirmationParams {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  checkIn: Date;
  checkOut: Date;
  nights: number;
  totalAmount: number;
  currency: string;
}

export async function sendGuestHotelConfirmation(
  params: GuestHotelConfirmationParams
): Promise<void> {
  const {
    guestEmail,
    guestName,
    propertyName,
    checkIn,
    checkOut,
    nights,
    totalAmount,
    currency,
  } = params;

  const subject = `Your booking at ${propertyName} is confirmed`;

  const checkInLabel = checkIn.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const checkOutLabel = checkOut.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const amountLabel = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalAmount);

  if (!HAS_RESEND) {
    devLog(subject, `${BASE_URL}/bookings`);
    console.log(
      `  Guest: ${guestName} | Property: ${propertyName} | ${checkInLabel} – ${checkOutLabel} | ${nights} night${nights !== 1 ? "s" : ""} | ${amountLabel}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Booking confirmed!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Hi ${guestName}, your stay at <strong style="color:#111827;">${propertyName}</strong> is confirmed. Here are your details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;width:40%;">Property</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${propertyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Check-in</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${checkInLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Check-out</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${checkOutLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Nights</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${nights} night${nights !== 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Total</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${amountLabel}</td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">We look forward to hosting you. Have a wonderful stay!</p>
    `),
  });
}

export interface GuestReservationConfirmationParams {
  guestEmail: string;
  guestName: string;
  restaurantName: string;
  dateTime: Date;
  partySize: number;
}

export async function sendGuestReservationConfirmation(
  params: GuestReservationConfirmationParams
): Promise<void> {
  const { guestEmail, guestName, restaurantName, dateTime, partySize } = params;

  const subject = `Your reservation at ${restaurantName} is confirmed`;

  const dateLabel = dateTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeLabel = dateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (!HAS_RESEND) {
    devLog(subject, `${BASE_URL}/bookings`);
    console.log(
      `  Guest: ${guestName} | Restaurant: ${restaurantName} | ${dateLabel} at ${timeLabel} | ${partySize} guest${partySize !== 1 ? "s" : ""}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#111827;">Reservation confirmed!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#6b7280;line-height:1.6;">
        Hi ${guestName}, your table at <strong style="color:#111827;">${restaurantName}</strong> is confirmed. Here are your details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;width:40%;">Restaurant</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${dateLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${timeLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#9ca3af;">Party size</td>
          <td style="padding:8px 0;font-size:14px;color:#111827;font-weight:600;">${partySize} guest${partySize !== 1 ? "s" : ""}</td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#9ca3af;">We look forward to seeing you. Enjoy your dining experience!</p>
    `),
  });
}

export { HAS_RESEND };

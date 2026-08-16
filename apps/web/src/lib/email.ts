/**
 * Email utility — uses Resend when RESEND_API_KEY is set.
 * In development without the key, links are logged to the console instead.
 */
// Run startup config check so deployment logs surface misconfigurations early
import "./config-check";

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
const FROM = process.env.EMAIL_FROM ?? "dontbeboring <onboarding@resend.dev>";
// When set, all outgoing emails are redirected to this address (useful while
// the sending domain is not yet verified in Resend).
const OVERRIDE_TO = process.env.EMAIL_OVERRIDE_TO ?? null;
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
<body style="margin:0;padding:0;background:#F6F8FB;font-family:ui-sans-serif,system-ui,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F6F8FB;padding:40px 20px;">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;border:1px solid #D8E0EC;overflow:hidden;">
        <tr>
          <td style="padding:32px 32px 0;">
            <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#8A6914;">dontbeboring</p>
            ${content}
          </td>
        </tr>
        <tr>
          <td style="padding:24px 32px;background:#F6F8FB;border-top:1px solid #D8E0EC;">
            <p style="margin:0;font-size:12px;color:#5D708F;">
              Exceptional experiences across East Africa
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
  return `<a href="${href}" style="display:inline-block;background:#8A6914;color:#ffffff;padding:12px 28px;border-radius:8px;text-decoration:none;font-weight:600;font-size:14px;margin-bottom:24px;">${label}</a>`;
}

// ─── Email verification ───────────────────────────────────────────────────────

export async function sendVerificationEmail(email: string, token: string): Promise<void> {
  const url = `${BASE_URL}/api/auth/verify-email?token=${token}`;

  if (!HAS_RESEND) {
    devLog("Verify your dontbeboring account", url);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? email,
    subject: "Verify your dontbeboring account",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Verify your email address</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Thanks for signing up! Click the button below to verify your email and activate your account.
      </p>
      ${primaryButton(url, "Verify email address")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">Link expires in 24 hours.</p>
    `),
  });
}

// ─── Password reset ───────────────────────────────────────────────────────────

export async function sendPasswordResetEmail(email: string, token: string): Promise<void> {
  const url = `${BASE_URL}/auth/reset-password?token=${token}`;

  if (!HAS_RESEND) {
    devLog("Reset your dontbeboring password", url);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? email,
    subject: "Reset your dontbeboring password",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Reset your password</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        We received a request to reset your password. Click the button below to choose a new one.
      </p>
      ${primaryButton(url, "Reset password")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">Link expires in 1 hour.</p>
      <p style="margin:0;font-size:13px;color:#5D708F;">If you didn't request this, ignore this email.</p>
    `),
  });
}

// ─── Partner booking notification ────────────────────────────────────────────

export interface PartnerBookingEmailParams {
  partnerEmail: string;
  partnerName: string;
  guestName: string;
  propertyName: string;
  propertyType: "hotel" | "restaurant" | "event";
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

  const typeWord = propertyType === "hotel" ? "booking" : propertyType === "event" ? "ticket order" : "reservation";
  const subject = `New ${typeWord} at ${propertyName}`;

  if (!HAS_RESEND) {
    devLog(subject, dashboardUrl);
    console.log(
      `  Guest: ${guestName} | Property: ${propertyName} | Detail: ${bookingDetail}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  const typeLabel = propertyType === "hotel" ? "booking" : propertyType === "event" ? "ticket order" : "reservation";

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? partnerEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">New ${typeLabel} request</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${partnerName}, you have a new ${typeLabel} waiting for your attention.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Guest</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${guestName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Property</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${propertyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Details</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${bookingDetail}</td>
        </tr>
      </table>
      ${primaryButton(dashboardUrl, "View on dashboard")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">Log in to confirm or manage this ${typeLabel}.</p>
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
    devLog(subject, `${BASE_URL}/dashboard/bookings`);
    console.log(
      `  Guest: ${guestName} | Property: ${propertyName} | ${checkInLabel} – ${checkOutLabel} | ${nights} night${nights !== 1 ? "s" : ""} | ${amountLabel}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Booking confirmed!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, your stay at <strong style="color:#131E30;">${propertyName}</strong> is confirmed. Here are your details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Property</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${propertyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Check-in</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${checkInLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Check-out</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${checkOutLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Nights</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${nights} night${nights !== 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Total</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${amountLabel}</td>
        </tr>
      </table>
      ${primaryButton(`${BASE_URL}/dashboard/bookings`, "View booking")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">
        Need to cancel or make changes? You can manage or cancel this booking from
        <a href="${BASE_URL}/dashboard/bookings" style="color:#8A6914;">your bookings page</a>
        (cancellation may not be available close to check-in).
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">We look forward to hosting you. Have a wonderful stay!</p>
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
    devLog(subject, `${BASE_URL}/dashboard/bookings`);
    console.log(
      `  Guest: ${guestName} | Restaurant: ${restaurantName} | ${dateLabel} at ${timeLabel} | ${partySize} guest${partySize !== 1 ? "s" : ""}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Reservation confirmed!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, your table at <strong style="color:#131E30;">${restaurantName}</strong> is confirmed. Here are your details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Restaurant</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${dateLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${timeLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Party size</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${partySize} guest${partySize !== 1 ? "s" : ""}</td>
        </tr>
      </table>
      ${primaryButton(`${BASE_URL}/dashboard/bookings`, "View reservation")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">
        Need to cancel or make changes? Manage this reservation from
        <a href="${BASE_URL}/dashboard/bookings" style="color:#8A6914;">your bookings page</a>.
      </p>
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">We look forward to seeing you. Enjoy your dining experience!</p>
    `),
  });
}

// ─── Guest enquiry received (hotel/restaurant, pre-partner-confirmation) ──────
//
// Hotels and restaurants aren't paid through the platform yet, so a booking
// request only becomes real once the property accepts it. These emails set
// that expectation immediately; sendGuestHotelConfirmation /
// sendGuestReservationConfirmation above are sent again, for real, once the
// partner confirms.

export async function sendGuestHotelEnquiryReceived(
  params: GuestHotelConfirmationParams
): Promise<void> {
  const { guestEmail, guestName, propertyName, checkIn, checkOut, nights, totalAmount, currency } = params;

  const subject = `Your request at ${propertyName} has been sent`;
  const checkInLabel = checkIn.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const checkOutLabel = checkOut.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const amountLabel = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalAmount);

  if (!HAS_RESEND) {
    devLog(subject, `${BASE_URL}/dashboard/bookings`);
    console.log(`  Guest: ${guestName} | Property: ${propertyName} | ${checkInLabel} – ${checkOutLabel}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Request sent!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, we've sent your stay request to <strong style="color:#131E30;">${propertyName}</strong>. This isn't confirmed yet — the property will accept or decline shortly, and we'll email you the moment they respond.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Property</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${propertyName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Check-in</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${checkInLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Check-out</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${checkOutLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Nights</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${nights} night${nights !== 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Estimated total</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${amountLabel}</td>
        </tr>
      </table>
      ${primaryButton(`${BASE_URL}/dashboard/bookings`, "Track this request")}
      <p style="margin:0;font-size:13px;color:#5D708F;">No payment has been taken. You'll settle up directly with the property.</p>
    `),
  });
}

export async function sendGuestReservationEnquiryReceived(
  params: GuestReservationConfirmationParams
): Promise<void> {
  const { guestEmail, guestName, restaurantName, dateTime, partySize } = params;

  const subject = `Your request at ${restaurantName} has been sent`;
  const dateLabel = dateTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeLabel = dateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  if (!HAS_RESEND) {
    devLog(subject, `${BASE_URL}/dashboard/bookings`);
    console.log(`  Guest: ${guestName} | Restaurant: ${restaurantName} | ${dateLabel} at ${timeLabel}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Request sent!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, we've sent your table request to <strong style="color:#131E30;">${restaurantName}</strong>. This isn't confirmed yet — the restaurant will accept or decline shortly, and we'll email you the moment they respond.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Restaurant</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${restaurantName}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${dateLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${timeLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Party size</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${partySize} guest${partySize !== 1 ? "s" : ""}</td>
        </tr>
      </table>
      ${primaryButton(`${BASE_URL}/dashboard/bookings`, "Track this request")}
    `),
  });
}

export interface GuestRequestDeclinedParams {
  guestEmail: string;
  guestName: string;
  propertyName: string;
  propertyType: "hotel" | "restaurant";
}

export async function sendGuestRequestDeclined(params: GuestRequestDeclinedParams): Promise<void> {
  const { guestEmail, guestName, propertyName, propertyType } = params;
  const noun = propertyType === "hotel" ? "stay" : "table";
  const browseUrl = `${BASE_URL}/${propertyType === "hotel" ? "hotels" : "restaurants"}`;

  const subject = `Update on your request at ${propertyName}`;

  if (!HAS_RESEND) {
    devLog(subject, browseUrl);
    console.log(`  Guest: ${guestName} | Property: ${propertyName} | Declined`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Couldn't confirm this one</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, unfortunately <strong style="color:#131E30;">${propertyName}</strong> wasn't able to confirm your ${noun} request. No charge has been made. Here are other options that might work instead.
      </p>
      ${primaryButton(browseUrl, `Browse ${propertyType === "hotel" ? "hotels" : "restaurants"}`)}
    `),
  });
}

// ─── Guest event ticket confirmation ─────────────────────────────────────────

export interface GuestEventConfirmationParams {
  guestEmail: string;
  guestName: string;
  eventTitle: string;
  eventDate: Date;
  quantity: number;
  totalAmount: number;
  currency: string;
}

export async function sendGuestEventConfirmation(
  params: GuestEventConfirmationParams
): Promise<void> {
  const { guestEmail, guestName, eventTitle, eventDate, quantity, totalAmount, currency } = params;

  const subject = `Your tickets for ${eventTitle} are confirmed`;

  const dateLabel = eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeLabel = eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const amountLabel = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalAmount);

  if (!HAS_RESEND) {
    devLog(subject, `${BASE_URL}/dashboard/bookings`);
    console.log(
      `  Guest: ${guestName} | Event: ${eventTitle} | ${dateLabel} at ${timeLabel} | ${quantity} ticket${quantity !== 1 ? "s" : ""} | ${amountLabel}`
    );
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? guestEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Tickets confirmed!</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${guestName}, your ticket${quantity !== 1 ? "s" : ""} for <strong style="color:#131E30;">${eventTitle}</strong> ${quantity !== 1 ? "are" : "is"} confirmed. Here are your details:
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Event</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${eventTitle}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Date</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${dateLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Time</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${timeLabel}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Tickets</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${quantity} ticket${quantity !== 1 ? "s" : ""}</td>
        </tr>
        <tr>
          <td style="padding:8px 0;font-size:14px;color:#5D708F;">Total</td>
          <td style="padding:8px 0;font-size:14px;color:#131E30;font-weight:600;">${amountLabel}</td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">We look forward to seeing you there. Enjoy the event!</p>
    `),
  });
}

export { HAS_RESEND };

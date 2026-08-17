/**
 * Email utility — uses Resend when RESEND_API_KEY is set.
 * In development without the key, links are logged to the console instead.
 */
// Run startup config check so deployment logs surface misconfigurations early
import "./config-check";
import { prisma } from "./prisma";

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
              Exceptional experiences across Kenya
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

// ─── Venue listing claims ────────────────────────────────────────────────────

export interface VenueClaim {
  venueName: string;
  venueType: "hotel" | "restaurant" | "club";
  venueId: string;
  contactName: string;
  role: string;
  workEmail: string;
  phone: string;
  website?: string;
}

/**
 * Alerts the team that someone wants to take ownership of a listing.
 *
 * Goes to our own inbox, never to the venue's seeded address — that address is
 * unconfirmed research, and mailing it about a claim would be both noise to a
 * stranger and a way to leak who is claiming what.
 */
export async function sendVenueClaimNotification(claim: VenueClaim): Promise<void> {
  const subject = `Listing claim: ${claim.venueName}`;
  const link = `${BASE_URL}/${claim.venueType}s/${claim.venueId}`;

  if (!HAS_RESEND) {
    devLog(subject, link);
    console.log(`  ${claim.contactName} (${claim.role}) — ${claim.workEmail} / ${claim.phone}`);
    if (claim.website) console.log(`  website: ${claim.website}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? process.env.CLAIMS_INBOX ?? FROM,
    replyTo: claim.workEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Listing claim</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        <strong>${claim.contactName}</strong> (${claim.role}) says they work at
        <strong>${claim.venueName}</strong>.
      </p>
      <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
        <tr><td style="padding:8px 0;font-size:14px;color:#5D708F;width:40%;">Email</td><td style="padding:8px 0;font-size:14px;color:#131E30;">${claim.workEmail}</td></tr>
        <tr><td style="padding:8px 0;font-size:14px;color:#5D708F;">Phone</td><td style="padding:8px 0;font-size:14px;color:#131E30;">${claim.phone}</td></tr>
        ${claim.website ? `<tr><td style="padding:8px 0;font-size:14px;color:#5D708F;">Booking page</td><td style="padding:8px 0;font-size:14px;color:#131E30;">${claim.website}</td></tr>` : ""}
        <tr><td style="padding:8px 0;font-size:14px;color:#5D708F;">Listing</td><td style="padding:8px 0;font-size:14px;color:#131E30;">${link}</td></tr>
      </table>
      <p style="margin:0;font-size:13px;color:#5D708F;">Confirm they work there before changing anything on the listing.</p>
    `),
  });
}

// ─── Public event submission review ──────────────────────────────────────────

/**
 * Where "new event to review" alerts go.
 *
 * ADMIN_INBOX is an explicit override, same convention as CLAIMS_INBOX. Left
 * unset, this falls back to whichever accounts currently hold the
 * SUPER_ADMIN role — the one role allowed to approve or reject a submission
 * — so notifications keep reaching the right inbox even as who holds that
 * role changes, with no env var to remember to update.
 */
async function resolveAdminInbox(): Promise<string> {
  if (process.env.ADMIN_INBOX) return process.env.ADMIN_INBOX;

  const superAdmins = await prisma.user.findMany({
    where: { role: "SUPER_ADMIN" },
    select: { email: true },
  });
  const emails = superAdmins.map((u) => u.email).filter(Boolean);
  return emails.length > 0 ? emails.join(",") : FROM;
}

export interface EventSubmissionReceivedParams {
  toEmail: string;
  toName?: string | null;
  eventTitle: string;
}

/**
 * Sent to the organizer the moment they submit (or fix and resubmit) an
 * event — the "yes, this went somewhere" reassurance a form with no
 * confirmation email leaves people guessing about.
 */
export async function sendEventSubmissionReceived(params: EventSubmissionReceivedParams): Promise<void> {
  const { toEmail, toName, eventTitle } = params;
  const subject = `"${eventTitle}" is pending approval`;
  const trackUrl = `${BASE_URL}/partner/events`;

  if (!HAS_RESEND) {
    devLog(subject, trackUrl);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? toEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Submitted for review</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${toName ?? "there"}, we've received <strong style="color:#131E30;">${eventTitle}</strong>.
        Our team reviews every new event by hand, usually within 24 hours. We'll email you the moment
        it's approved and live — or if we need something changed first.
      </p>
      ${primaryButton(trackUrl, "Track its status")}
    `),
  });
}

export interface EventSubmissionAdminAlertParams {
  eventTitle: string;
  partnerName: string;
  city: string;
}

/** Alerts whoever can approve it that a new event is waiting in the queue. */
export async function sendEventSubmissionAdminAlert(params: EventSubmissionAdminAlertParams): Promise<void> {
  const { eventTitle, partnerName, city } = params;
  const subject = `New event to review: ${eventTitle}`;
  const link = `${BASE_URL}/admin/events`;
  const recipients = await resolveAdminInbox();

  if (!HAS_RESEND) {
    devLog(subject, link);
    console.log(`  ${partnerName} · ${city} → notifying: ${recipients}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? recipients,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">New event waiting for review</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        <strong style="color:#131E30;">${partnerName}</strong> submitted
        <strong style="color:#131E30;">${eventTitle}</strong> (${city}) for approval.
      </p>
      ${primaryButton(link, "Review submissions")}
    `),
  });
}

export interface EventApprovedEmailParams {
  toEmail: string;
  toName?: string | null;
  eventTitle: string;
  eventId: string;
}

export async function sendEventApprovedEmail(params: EventApprovedEmailParams): Promise<void> {
  const { toEmail, toName, eventTitle, eventId } = params;
  const subject = `"${eventTitle}" is live!`;
  const url = `${BASE_URL}/events/${eventId}`;

  if (!HAS_RESEND) {
    devLog(subject, url);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? toEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Approved and live</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${toName ?? "there"}, <strong style="color:#131E30;">${eventTitle}</strong> has been approved and
        is now live on dontbeboring.
      </p>
      ${primaryButton(url, "View your event")}
    `),
  });
}

export interface EventRejectedEmailParams {
  toEmail: string;
  toName?: string | null;
  eventTitle: string;
  reason: string;
}

export async function sendEventRejectedEmail(params: EventRejectedEmailParams): Promise<void> {
  const { toEmail, toName, eventTitle, reason } = params;
  const subject = `Changes needed on "${eventTitle}"`;
  const editUrl = `${BASE_URL}/partner/events`;

  if (!HAS_RESEND) {
    devLog(subject, editUrl);
    console.log(`  Reason: ${reason}`);
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? toEmail,
    subject,
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Changes needed</h2>
      <p style="margin:0 0 16px;font-size:15px;color:#435671;line-height:1.6;">
        Hi ${toName ?? "there"}, we weren't able to approve
        <strong style="color:#131E30;">${eventTitle}</strong> yet.
      </p>
      <p style="margin:0 0 24px;font-size:14px;color:#131E30;background:#FDF3E7;border-radius:8px;padding:12px 16px;">
        ${reason}
      </p>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Fix it up and save your changes — editing sends it straight back into the review queue,
        no need to submit it again from scratch.
      </p>
      ${primaryButton(editUrl, "Edit and resubmit")}
    `),
  });
}

// ─── Passwordless sign-in code ───────────────────────────────────────────────

export async function sendSignInCodeEmail(
  email: string,
  code: string,
  ttlMinutes: number
): Promise<void> {
  if (!HAS_RESEND) {
    devLog(`Your dontbeboring sign-in code: ${code}`, "(no link — enter the code)");
    return;
  }

  const { Resend } = await import("resend");
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: FROM,
    to: OVERRIDE_TO ?? email,
    // The code stays out of the subject line: subjects show in notification
    // previews on a locked screen, where a shoulder is all it takes.
    subject: "Your dontbeboring sign-in code",
    html: emailWrapper(`
      <h2 style="margin:0 0 8px;font-size:20px;color:#131E30;">Your sign-in code</h2>
      <p style="margin:0 0 24px;font-size:15px;color:#435671;line-height:1.6;">
        Enter this code to finish signing in.
      </p>
      <p style="margin:0 0 24px;font-size:34px;font-weight:700;letter-spacing:8px;color:#8A6914;">${code}</p>
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;">The code expires in ${ttlMinutes} minutes and can be used once.</p>
      <p style="margin:0;font-size:13px;color:#5D708F;">If you did not ask to sign in, you can ignore this email — nobody can use the code without it.</p>
    `),
  });
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
  /** Needed for the link to the tickets themselves — the point of the email. */
  bookingId: string;
}

export async function sendGuestEventConfirmation(
  params: GuestEventConfirmationParams
): Promise<void> {
  const { guestEmail, guestName, eventTitle, eventDate, quantity, totalAmount, currency, bookingId } = params;

  const subject = `Your tickets for ${eventTitle} are confirmed`;

  const dateLabel = eventDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  const timeLabel = eventDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  const amountLabel = new Intl.NumberFormat("en-US", { style: "currency", currency }).format(totalAmount);
  const ticketsUrl = `${BASE_URL}/tickets/${bookingId}`;

  if (!HAS_RESEND) {
    devLog(subject, ticketsUrl);
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
      ${primaryButton(ticketsUrl, quantity !== 1 ? "View your tickets" : "View your ticket")}
      <p style="margin:0 0 8px;font-size:13px;color:#5D708F;line-height:1.6;">
        Open that link at the door and show the code on screen — a screenshot works just as
        well. Each code admits one person, once.
      </p>
      <p style="margin:0;font-size:13px;color:#5D708F;">We look forward to seeing you there.</p>
    `),
  });
}

export { HAS_RESEND };

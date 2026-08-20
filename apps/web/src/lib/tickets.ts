/**
 * Ticket issuance and verification.
 *
 * The security model, in one line: a ticket is only admitted if it carries a
 * signature that could only have been produced with a secret the server holds,
 * and if this exact ticket has not already walked through the door.
 *
 * The QR payload is `<ticketId>.<hmac>` — not a bare id. A bare id would mean
 * anyone who saw one ticket could guess or enumerate others; the HMAC makes a
 * forged ticket require the signing key rather than a plausible-looking string.
 * The payload deliberately carries no personal data, because a QR code shown on
 * a phone in a queue is readable by anyone standing behind you.
 *
 * What this does NOT defend against, and no ticketing system can: a buyer
 * screenshotting their own valid ticket and sending it to someone else. That
 * is why check-in is single-use and atomic — the first scan admits, every
 * later scan is refused. The forgery is prevented cryptographically; the
 * sharing is caught at the door.
 */
import { createHmac, timingSafeEqual, randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import type { PrismaClient, Prisma } from "@prisma/client";

/**
 * Signing key for ticket QR codes.
 *
 * Falls back to NEXTAUTH_SECRET so a development environment works without
 * extra setup, but production should set its own: rotating the session secret
 * would otherwise invalidate every ticket already in a guest's inbox.
 */
function signingSecret(): string {
  const secret = process.env.TICKET_SIGNING_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      "TICKET_SIGNING_SECRET (or NEXTAUTH_SECRET) must be set to issue or verify tickets"
    );
  }
  return secret;
}

function sign(ticketId: string): string {
  return createHmac("sha256", signingSecret()).update(ticketId).digest("base64url");
}

/** The string encoded into the QR image. Safe to print; carries no personal data. */
export function ticketToken(ticketId: string): string {
  return `${ticketId}.${sign(ticketId)}`;
}

export type TicketVerdict =
  | { ok: true; ticketId: string }
  | { ok: false; reason: "malformed" | "bad-signature" };

/**
 * Checks a scanned token's signature. Purely cryptographic — says nothing about
 * whether the ticket has been used, which is `checkInTicket`'s job.
 */
export function verifyTicketToken(token: string): TicketVerdict {
  const parts = token.trim().split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) return { ok: false, reason: "malformed" };

  const [ticketId, provided] = parts;
  const expected = sign(ticketId);

  // Compare in constant time. A length check first because timingSafeEqual
  // throws on mismatched buffers, and length alone leaks nothing useful.
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: "bad-signature" };
  }
  return { ok: true, ticketId };
}

type TicketClient = PrismaClient | Prisma.TransactionClient;

/**
 * Creates one ticket per seat on a confirmed booking.
 *
 * Idempotent by construction: the @@unique([bookingId, serial]) constraint plus
 * skipDuplicates means a webhook delivered twice cannot mint a second set of
 * tickets for the same booking, which would otherwise let a duplicate callback
 * double the size of a party.
 */
export async function issueTicketsForBooking(
  bookingId: string,
  eventId: string,
  quantity: number,
  client: TicketClient = prisma
) {
  await client.ticket.createMany({
    data: Array.from({ length: quantity }, (_, i) => ({
      bookingId,
      eventId,
      serial: i + 1,
    })),
    skipDuplicates: true,
  });

  return client.ticket.findMany({
    where: { bookingId },
    orderBy: { serial: "asc" },
  });
}

export type CheckInResult =
  | { status: "admitted"; ticket: { id: string; serial: number; attendeeName: string | null } }
  | { status: "already-used"; ticketId: string; checkedInAt: Date | null }
  | { status: "void" }
  | { status: "wrong-event" }
  | { status: "not-found" }
  | { status: "invalid" };

/**
 * Admits a scanned ticket, exactly once.
 *
 * The state change is a conditional updateMany rather than read-then-write. Two
 * gates scanning the same code at the same instant both attempt the update; the
 * row only matches `status: VALID` for one of them, so exactly one gets a count
 * of 1 and admits. Reading first and updating after would let both see VALID
 * and both open the door.
 */
export async function checkInTicket(params: {
  token: string;
  eventId: string;
  scannedBy: string;
}): Promise<CheckInResult> {
  const verdict = verifyTicketToken(params.token);
  if (!verdict.ok) return { status: "invalid" };

  const existing = await prisma.ticket.findUnique({
    where: { id: verdict.ticketId },
    select: { id: true, eventId: true, status: true, serial: true, attendeeName: true, checkedInAt: true },
  });
  if (!existing) return { status: "not-found" };

  // A validly-signed ticket for a different event is still a refusal — staff
  // scanning at one door must not admit last week's crowd.
  if (existing.eventId !== params.eventId) return { status: "wrong-event" };
  if (existing.status === "VOID") return { status: "void" };

  const claimed = await prisma.ticket.updateMany({
    where: { id: existing.id, status: "VALID" },
    data: { status: "CHECKED_IN", checkedInAt: new Date(), checkedInBy: params.scannedBy },
  });

  if (claimed.count === 0) {
    // Lost the race, or it was already CHECKED_IN before we looked.
    const now = await prisma.ticket.findUnique({
      where: { id: existing.id },
      select: { checkedInAt: true },
    });
    return { status: "already-used", ticketId: existing.id, checkedInAt: now?.checkedInAt ?? existing.checkedInAt };
  }

  return {
    status: "admitted",
    ticket: { id: existing.id, serial: existing.serial, attendeeName: existing.attendeeName },
  };
}

/** Opaque idempotency key for callers that need one; not used for signing. */
export function newIdempotencyKey(): string {
  return randomUUID();
}

/**
 * A short, human-readable code derived from the ticket id — for a door team
 * to read aloud or radio to another gate if a scanner dies. This is NOT a
 * second way to check someone in: `checkInTicket` still only ever accepts a
 * token that passes `verifyTicketToken`, so this string alone admits no one.
 * It exists purely so a person can identify a ticket without a working
 * scanner, not to identify a *person* — it carries no personal data either.
 */
export function referenceCode(ticketId: string): string {
  const clean = ticketId.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
  const tail = clean.slice(-8).padStart(8, "0");
  return `${tail.slice(0, 4)}-${tail.slice(4)}`;
}

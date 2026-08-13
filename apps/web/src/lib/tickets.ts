import { randomBytes } from "crypto";

/**
 * Short, unguessable check-in codes for event tickets. Deliberately not a
 * long opaque token: staff need to be able to type it in by hand as a
 * fallback when a QR scan isn't possible. It's not a secret in the
 * authentication sense — only an authenticated PARTNER/ADMIN who owns the
 * event can actually perform a check-in with it (see /checkin/[token]).
 *
 * 8 chars from a 32-symbol alphabet (Crockford-ish, no 0/O/1/I) is ~40 bits
 * of entropy, plenty for this threat model.
 */
const ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";

export function generateCheckInToken(): string {
  const bytes = randomBytes(8);
  let token = "";
  for (const byte of bytes) {
    token += ALPHABET[byte % ALPHABET.length];
  }
  return token;
}

/**
 * Renders a QR code as an <img> src via a public QR image service — no new
 * dependency needed. The encoded payload is just the check-in URL, which is
 * already meant to be shared with the ticket holder, so there's nothing
 * sensitive in what gets sent to the third-party renderer.
 */
export function qrCodeImageUrl(data: string, size = 280): string {
  return `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(data)}`;
}

export function checkInUrl(baseUrl: string, token: string): string {
  return `${baseUrl}/checkin/${token}`;
}

import { randomBytes } from "crypto";
import { prisma } from "./prisma";

// ─── Email verification tokens ────────────────────────────────────────────────

/**
 * Prunes expired email-verification tokens so the table does not grow
 * unboundedly. Fire-and-forget safe — failures are logged, never thrown.
 */
export function pruneExpiredEmailVerificationTokens(): Promise<unknown> {
  return prisma.emailVerificationToken
    .deleteMany({ where: { expires: { lt: new Date() } } })
    .catch((err: unknown) =>
      console.error("[tokens] expired email-verification token cleanup failed:", err)
    );
}

export async function createEmailVerificationToken(email: string): Promise<string> {
  // Opportunistically prune expired tokens (all emails) so stale rows never
  // build up. Fire-and-forget — no need to await before continuing.
  pruneExpiredEmailVerificationTokens();

  // Delete any existing tokens for this email
  await prisma.emailVerificationToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  await prisma.emailVerificationToken.create({ data: { email, token, expires } });
  return token;
}

export type EmailVerificationResult =
  | { email: string; expired: false }
  | { expired: true }
  | null;

/**
 * Validates and atomically consumes an email verification token.
 * The token is deleted from the database regardless of whether it is valid or
 * expired, making it strictly single-use.
 *
 * Returns:
 *  - `{ email, expired: false }` — valid token; email is ready to be verified
 *  - `{ expired: true }`         — token existed but has passed its 24h window
 *  - `null`                      — token not found (already used or never issued)
 */
export async function validateEmailVerificationToken(
  token: string
): Promise<EmailVerificationResult> {
  // Delete the token and return it in one atomic operation so it can never be
  // replayed, even if two requests arrive simultaneously.
  const deleted = await prisma.emailVerificationToken
    .delete({ where: { token } })
    .catch(() => null); // throws P2025 when not found — treat as null

  if (!deleted) return null;

  if (deleted.expires < new Date()) {
    return { expired: true };
  }

  return { email: deleted.email, expired: false };
}

// ─── Password reset tokens ────────────────────────────────────────────────────

export async function createPasswordResetToken(email: string): Promise<string> {
  await prisma.passwordResetToken.deleteMany({ where: { email } });

  const token = randomBytes(32).toString("hex");
  const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  await prisma.passwordResetToken.create({ data: { email, token, expires } });
  return token;
}

export type PasswordResetResult =
  | { email: string; expired: false }
  | { expired: true }
  | null;

/**
 * Validates and atomically consumes a password-reset token.
 * The token is deleted from the database regardless of whether it is valid or
 * expired, making it strictly single-use (mirrors validateEmailVerificationToken).
 *
 * Returns:
 *  - `{ email, expired: false }` — valid token; caller may update the password
 *  - `{ expired: true }`         — token existed but has passed its 1h window
 *  - `null`                      — token not found (already used or never issued)
 */
export async function validatePasswordResetToken(
  token: string
): Promise<PasswordResetResult> {
  // Delete the token and return it in one atomic operation so it can never be
  // replayed, even if two requests arrive simultaneously.
  const deleted = await prisma.passwordResetToken
    .delete({ where: { token } })
    .catch(() => null); // throws P2025 when not found — treat as null

  if (!deleted) return null;

  if (deleted.expires < new Date()) {
    return { expired: true };
  }

  return { email: deleted.email, expired: false };
}

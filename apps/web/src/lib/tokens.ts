import { randomBytes } from "crypto";
import { prisma } from "./prisma";

// ─── Email verification tokens ────────────────────────────────────────────────

export async function createEmailVerificationToken(email: string): Promise<string> {
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

export async function validatePasswordResetToken(
  token: string
): Promise<{ email: string } | null> {
  const record = await prisma.passwordResetToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expires < new Date()) {
    await prisma.passwordResetToken.delete({ where: { token } });
    return null;
  }
  return { email: record.email };
}

export async function deletePasswordResetToken(token: string): Promise<void> {
  await prisma.passwordResetToken.deleteMany({ where: { token } });
}

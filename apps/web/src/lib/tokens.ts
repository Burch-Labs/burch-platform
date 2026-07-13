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

export async function validateEmailVerificationToken(
  token: string
): Promise<{ email: string } | null> {
  const record = await prisma.emailVerificationToken.findUnique({ where: { token } });
  if (!record) return null;
  if (record.expires < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { token } });
    return null;
  }
  return { email: record.email };
}

export async function deleteEmailVerificationToken(token: string): Promise<void> {
  await prisma.emailVerificationToken.deleteMany({ where: { token } });
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

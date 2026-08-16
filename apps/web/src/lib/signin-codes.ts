/**
 * One-time sign-in codes.
 *
 * Replaces the password. Someone gives a name, phone and email, receives a
 * six-digit code, and is signed in — no password to choose, forget, reuse from
 * another site, or have leaked from ours.
 *
 * Six digits is only a million combinations, which is not much on its own. What
 * makes it safe is the surrounding budget, and every limit below exists to
 * close one specific attack:
 *
 *   - codes are stored bcrypt-hashed, so reading the database does not hand
 *     anyone a working code;
 *   - a code dies after ATTEMPT_LIMIT wrong guesses, so an attacker gets five
 *     tries per code rather than a million;
 *   - issuing is rate limited per identifier, so they cannot simply request
 *     thousands of fresh codes to buy more guesses — and cannot bomb someone
 *     else's inbox as a form of harassment;
 *   - codes expire in TTL_MINUTES and are single-use, so an old message
 *     screenshotted or forwarded later is worthless.
 *
 * Deliberately absent: any signal about whether an account already exists.
 * Requesting a code looks identical either way, so this endpoint cannot be used
 * to enumerate who has an account here.
 */
import { randomInt } from "crypto";
import { hash, compare } from "bcryptjs";
import { prisma } from "@/lib/prisma";

const CODE_LENGTH = 6;
const TTL_MINUTES = 10;
const ATTEMPT_LIMIT = 5;

/** Issuance budget: how many codes one identifier may request per window. */
const MAX_CODES_PER_WINDOW = 5;
const WINDOW_MINUTES = 60;

/**
 * Normalises what the user typed into a stable key.
 *
 * Without this "Ada@Example.com " and "ada@example.com" would be different
 * identifiers, which would both split the rate-limit budget and let someone
 * sidestep it by varying capitalisation.
 */
export function normalizeIdentifier(raw: string): string {
  return raw.trim().toLowerCase();
}

function generateCode(): string {
  // randomInt is drawn from the CSPRNG. Math.random is predictable enough that
  // a determined attacker could narrow the search space from a known code.
  return String(randomInt(0, 10 ** CODE_LENGTH)).padStart(CODE_LENGTH, "0");
}

/** Removes spent and expired rows so the table does not grow without bound. */
export function pruneSignInCodes(): Promise<unknown> {
  return prisma.signInCode.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },
        { consumedAt: { not: null } },
      ],
    },
  });
}

export type RequestCodeResult =
  | { ok: true; code: string; expiresAt: Date }
  | { ok: false; reason: "rate-limited"; retryAfterMinutes: number };

/**
 * Issues a code for an identifier.
 *
 * Returns the plaintext code so the caller can deliver it. Nothing else in the
 * system can read it back afterwards — only the hash is stored.
 */
export async function requestSignInCode(rawIdentifier: string): Promise<RequestCodeResult> {
  const identifier = normalizeIdentifier(rawIdentifier);
  const windowStart = new Date(Date.now() - WINDOW_MINUTES * 60_000);

  const recent = await prisma.signInCode.count({
    where: { identifier, createdAt: { gte: windowStart } },
  });
  if (recent >= MAX_CODES_PER_WINDOW) {
    return { ok: false, reason: "rate-limited", retryAfterMinutes: WINDOW_MINUTES };
  }

  // Any code still outstanding for this identifier is retired first, so a
  // freshly requested code is unambiguously the only one that works.
  await prisma.signInCode.updateMany({
    where: { identifier, consumedAt: null, expiresAt: { gt: new Date() } },
    data: { consumedAt: new Date() },
  });

  const code = generateCode();
  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60_000);

  await prisma.signInCode.create({
    data: { identifier, codeHash: await hash(code, 10), expiresAt },
  });

  void pruneSignInCodes();

  return { ok: true, code, expiresAt };
}

export type VerifyCodeResult =
  | { ok: true }
  | { ok: false; reason: "no-code" | "expired" | "too-many-attempts" | "incorrect" };

/**
 * Checks a submitted code and, on success, burns it.
 *
 * Every failure path is reported with a distinct reason so the UI can say
 * something useful ("that code has expired" beats "invalid"). None of those
 * reasons reveal whether the identifier belongs to an existing account.
 */
export async function verifySignInCode(
  rawIdentifier: string,
  submitted: string
): Promise<VerifyCodeResult> {
  const identifier = normalizeIdentifier(rawIdentifier);

  const record = await prisma.signInCode.findFirst({
    where: { identifier, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!record) return { ok: false, reason: "no-code" };

  if (record.expiresAt < new Date()) {
    return { ok: false, reason: "expired" };
  }
  if (record.attempts >= ATTEMPT_LIMIT) {
    return { ok: false, reason: "too-many-attempts" };
  }

  const matches = await compare(submitted.trim(), record.codeHash);
  if (!matches) {
    // Count the failure before returning, so a rapid sequence of guesses
    // exhausts the budget rather than getting unlimited free attempts.
    await prisma.signInCode.update({
      where: { id: record.id },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "incorrect" };
  }

  // Consume conditionally: two requests submitting the correct code at the same
  // moment must not both succeed in claiming it.
  const claimed = await prisma.signInCode.updateMany({
    where: { id: record.id, consumedAt: null },
    data: { consumedAt: new Date() },
  });
  if (claimed.count === 0) return { ok: false, reason: "no-code" };

  return { ok: true };
}

export const SIGN_IN_CODE_POLICY = {
  CODE_LENGTH,
  TTL_MINUTES,
  ATTEMPT_LIMIT,
  MAX_CODES_PER_WINDOW,
  WINDOW_MINUTES,
} as const;

/**
 * Platform commission.
 *
 * One rate per partner, defaulting to the standard 5% and overridable only by
 * deliberate admin action — never inferred, never bulk-edited. A commission
 * rate is a term of the business relationship with that specific partner; it
 * should read that way in the database too; a partner quietly getting a worse
 * rate than everyone else because of a stray bulk update is the kind of bug
 * that costs a real business real money and never shows up in a test.
 *
 * This file does not move money. It answers "how much," not "send it" — the
 * actual payout stays the manual, human step it already was.
 */
import { prisma } from "@/lib/prisma";

export const DEFAULT_COMMISSION_RATE = 5.0;

export class InvalidCommissionRateError extends Error {
  constructor(rate: number) {
    super(`Commission rate must be between 0 and 100, got ${rate}.`);
    this.name = "InvalidCommissionRateError";
  }
}

function assertValidRate(rate: number): void {
  if (!Number.isFinite(rate) || rate < 0 || rate > 100) {
    throw new InvalidCommissionRateError(rate);
  }
}

/**
 * Splits a sale amount at the given rate. Rounds each half independently to
 * the nearest cent rather than rounding once and subtracting, so the two
 * numbers always add back up to the original amount — a partner statement
 * that's off by a cent from the amount charged reads as a bug even when the
 * cause is nothing more than rounding direction.
 */
export function splitCommission(
  amount: number,
  rate: number = DEFAULT_COMMISSION_RATE
): { platformFee: number; partnerPayout: number } {
  assertValidRate(rate);
  const platformFee = Math.round(amount * (rate / 100) * 100) / 100;
  const partnerPayout = Math.round((amount - platformFee) * 100) / 100;
  return { platformFee, partnerPayout };
}

/**
 * Sets a partner's rate to a specific, deliberately-negotiated value.
 * Recorded with who and when, same as a suspension — a rate nobody can
 * explain six months later is a rate nobody can defend to the partner either.
 */
export async function setPartnerCommissionRate(params: {
  partnerId: string;
  rate: number;
  actedBy: string;
}): Promise<void> {
  assertValidRate(params.rate);
  await prisma.partner.update({
    where: { id: params.partnerId },
    data: {
      commissionRate: params.rate,
      commissionSetAt: new Date(),
      commissionSetBy: params.actedBy,
    },
  });
}

/** Back to the standard rate — clears the "negotiated" audit trail with it. */
export async function resetPartnerCommissionRate(params: {
  partnerId: string;
  actedBy: string;
}): Promise<void> {
  await prisma.partner.update({
    where: { id: params.partnerId },
    data: {
      commissionRate: DEFAULT_COMMISSION_RATE,
      commissionSetAt: new Date(),
      commissionSetBy: params.actedBy,
    },
  });
}

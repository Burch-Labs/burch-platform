/**
 * Payout eligibility.
 *
 * One rule, in one place, because "may this partner be paid" is the question
 * that must never get a soft answer. Anything that moves money calls
 * `assertPayoutEligible` and lets it throw, rather than checking a status field
 * inline and getting the comparison subtly wrong somewhere down the line.
 *
 * The split this file enforces: a partner lists the instant they sign up, and
 * is paid only after a human has checked who they are. Listing a venue you do
 * not own wastes a guest's time. Collecting their money for it is fraud, and it
 * is our chargebacks and our reputation either way.
 */
import { prisma } from "@/lib/prisma";
import type { PayoutStatus, PartnerStatus } from "@prisma/client";

export class PayoutNotPermittedError extends Error {
  constructor(readonly reason: PayoutBlockReason) {
    super(payoutBlockMessage(reason));
    this.name = "PayoutNotPermittedError";
  }
}

export type PayoutBlockReason =
  | "no-account"
  | "unverified"
  | "awaiting-review"
  | "rejected"
  | "partner-suspended";

export function payoutBlockMessage(reason: PayoutBlockReason): string {
  switch (reason) {
    case "no-account":
    case "unverified":
      return "Add your payout details before you can be paid out.";
    case "awaiting-review":
      return "Your payout details are being reviewed. Payouts start once that is done.";
    case "rejected":
      return "Your payout details were not accepted. Correct them and submit again.";
    case "partner-suspended":
      return "This account is suspended. Contact support.";
  }
}

/**
 * The single predicate. VERIFIED and an unsuspended partner, nothing else.
 *
 * Written as an exhaustive switch rather than `status === "VERIFIED"` so that
 * adding a state to the enum later fails the type check here, forcing whoever
 * adds it to decide whether money may move in it.
 */
export function payoutBlockReasonFor(input: {
  partnerStatus: PartnerStatus;
  payoutStatus: PayoutStatus | null;
}): PayoutBlockReason | null {
  if (input.partnerStatus === "SUSPENDED") return "partner-suspended";
  if (input.payoutStatus === null) return "no-account";

  switch (input.payoutStatus) {
    case "VERIFIED":
      return null;
    case "UNVERIFIED":
      return "unverified";
    case "SUBMITTED":
      return "awaiting-review";
    case "REJECTED":
      return "rejected";
  }
}

export async function getPayoutEligibility(partnerId: string) {
  const partner = await prisma.partner.findUnique({
    where: { id: partnerId },
    select: { status: true, payoutAccount: { select: { status: true } } },
  });
  if (!partner) return { eligible: false as const, reason: "no-account" as const };

  const reason = payoutBlockReasonFor({
    partnerStatus: partner.status,
    payoutStatus: partner.payoutAccount?.status ?? null,
  });

  return reason === null
    ? { eligible: true as const, reason: null }
    : { eligible: false as const, reason };
}

/**
 * Call this immediately before releasing funds. Throws rather than returning a
 * boolean so a forgotten `if` cannot silently pay an unverified partner — the
 * failure mode of a boolean is money leaving, which is the wrong way round.
 */
export async function assertPayoutEligible(partnerId: string): Promise<void> {
  const result = await getPayoutEligibility(partnerId);
  if (!result.eligible) throw new PayoutNotPermittedError(result.reason);
}

/** Fields the partner fills in. Everything else is set by review. */
export interface PayoutSubmission {
  legalName: string;
  taxId: string;
  idNumber: string;
  mpesaNumber?: string;
  bankName?: string;
  bankAccount?: string;
}

/**
 * Records a submission and moves the account to SUBMITTED.
 *
 * Resubmitting after a rejection clears the old reason, so the partner is not
 * left staring at stale feedback about details they have already corrected.
 */
export async function submitPayoutDetails(partnerId: string, details: PayoutSubmission) {
  const data = {
    ...details,
    mpesaNumber: details.mpesaNumber ?? null,
    bankName: details.bankName ?? null,
    bankAccount: details.bankAccount ?? null,
    status: "SUBMITTED" as const,
    submittedAt: new Date(),
    reviewedAt: null,
    reviewedBy: null,
    rejectionReason: null,
  };

  return prisma.payoutAccount.upsert({
    where: { partnerId },
    create: { partnerId, ...data },
    update: data,
  });
}

/**
 * Admin decision.
 *
 * Only ever moves an account out of SUBMITTED. Reviewing something nobody
 * submitted would let an approval be granted against blank details, so the
 * conditional update simply matches nothing in that case.
 */
export async function reviewPayoutAccount(params: {
  partnerId: string;
  decision: "VERIFIED" | "REJECTED";
  reviewedBy: string;
  rejectionReason?: string;
}): Promise<{ reviewed: boolean }> {
  const result = await prisma.payoutAccount.updateMany({
    where: { partnerId: params.partnerId, status: "SUBMITTED" },
    data: {
      status: params.decision,
      reviewedAt: new Date(),
      reviewedBy: params.reviewedBy,
      rejectionReason: params.decision === "REJECTED" ? params.rejectionReason ?? null : null,
    },
  });
  return { reviewed: result.count > 0 };
}

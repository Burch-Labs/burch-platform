/**
 * Payout eligibility.
 *
 * Every test here answers one question: can money reach this partner? A false
 * negative costs a legitimate partner a delay. A false positive funds a fake
 * listing with a guest's money, so the bias throughout is towards refusing.
 */
const mockPartnerFindUnique = jest.fn();
const mockUpsert = jest.fn();
const mockUpdateMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner:       { findUnique: (...a: unknown[]) => mockPartnerFindUnique(...a) },
    payoutAccount: {
      upsert:     (...a: unknown[]) => mockUpsert(...a),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
    },
  },
}));

import {
  assertPayoutEligible,
  getPayoutEligibility,
  payoutBlockReasonFor,
  PayoutNotPermittedError,
  reviewPayoutAccount,
  submitPayoutDetails,
} from "@/lib/payouts";

beforeEach(() => {
  jest.clearAllMocks();
  mockUpsert.mockResolvedValue({});
  mockUpdateMany.mockResolvedValue({ count: 1 });
});

describe("payoutBlockReasonFor", () => {
  it("permits only a verified account on an active partner", () => {
    expect(
      payoutBlockReasonFor({ partnerStatus: "APPROVED", payoutStatus: "VERIFIED" })
    ).toBeNull();
  });

  it.each([
    ["nothing submitted", "UNVERIFIED", "unverified"],
    ["awaiting a human", "SUBMITTED", "awaiting-review"],
    ["previously refused", "REJECTED", "rejected"],
  ] as const)("blocks when %s", (_label, payoutStatus, expected) => {
    expect(payoutBlockReasonFor({ partnerStatus: "APPROVED", payoutStatus })).toBe(expected);
  });

  it("blocks when no payout account exists at all", () => {
    expect(payoutBlockReasonFor({ partnerStatus: "APPROVED", payoutStatus: null })).toBe(
      "no-account"
    );
  });

  it("blocks a suspended partner even with a verified account", () => {
    // Suspension has to outrank verification, or suspending someone mid-fraud
    // would leave their payouts running.
    expect(
      payoutBlockReasonFor({ partnerStatus: "SUSPENDED", payoutStatus: "VERIFIED" })
    ).toBe("partner-suspended");
  });

  it("blocks a partner still pending listing approval", () => {
    expect(
      payoutBlockReasonFor({ partnerStatus: "PENDING", payoutStatus: "UNVERIFIED" })
    ).toBe("unverified");
  });
});

describe("assertPayoutEligible", () => {
  it("returns quietly for a verified partner", async () => {
    mockPartnerFindUnique.mockResolvedValueOnce({
      status: "APPROVED",
      payoutAccount: { status: "VERIFIED" },
    });
    await expect(assertPayoutEligible("p1")).resolves.toBeUndefined();
  });

  it("throws rather than returning false, so a missing check cannot pay out", async () => {
    mockPartnerFindUnique.mockResolvedValueOnce({
      status: "APPROVED",
      payoutAccount: { status: "SUBMITTED" },
    });
    await expect(assertPayoutEligible("p1")).rejects.toBeInstanceOf(PayoutNotPermittedError);
  });

  it("refuses an unknown partner", async () => {
    mockPartnerFindUnique.mockResolvedValueOnce(null);
    await expect(getPayoutEligibility("ghost")).resolves.toEqual({
      eligible: false,
      reason: "no-account",
    });
  });
});

describe("submitPayoutDetails", () => {
  const details = {
    legalName: "Wanjiru Events Ltd",
    taxId: "A012345678X",
    idNumber: "12345678",
    mpesaNumber: "254712345678",
  };

  it("lands in SUBMITTED, never straight to VERIFIED", async () => {
    // A partner must not be able to verify themselves by filling a form.
    await submitPayoutDetails("p1", details);
    const written = mockUpsert.mock.calls[0][0];
    expect(written.create.status).toBe("SUBMITTED");
    expect(written.update.status).toBe("SUBMITTED");
  });

  it("clears a previous rejection so old feedback does not linger", async () => {
    await submitPayoutDetails("p1", details);
    const { update } = mockUpsert.mock.calls[0][0];
    expect(update.rejectionReason).toBeNull();
    expect(update.reviewedAt).toBeNull();
    expect(update.reviewedBy).toBeNull();
  });
});

describe("reviewPayoutAccount", () => {
  it("verifies a submitted account and records who decided", async () => {
    const result = await reviewPayoutAccount({
      partnerId: "p1",
      decision: "VERIFIED",
      reviewedBy: "admin-1",
    });
    expect(result).toEqual({ reviewed: true });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { partnerId: "p1", status: "SUBMITTED" },
        data: expect.objectContaining({ status: "VERIFIED", reviewedBy: "admin-1" }),
      })
    );
  });

  it("only ever acts on a SUBMITTED account", async () => {
    // Guards against approving blank details nobody ever filled in.
    await reviewPayoutAccount({ partnerId: "p1", decision: "VERIFIED", reviewedBy: "admin-1" });
    expect(mockUpdateMany.mock.calls[0][0].where.status).toBe("SUBMITTED");
  });

  it("reports when there was nothing to review", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      reviewPayoutAccount({ partnerId: "p1", decision: "VERIFIED", reviewedBy: "admin-1" })
    ).resolves.toEqual({ reviewed: false });
  });

  it("keeps the reason on a rejection and drops it on an approval", async () => {
    await reviewPayoutAccount({
      partnerId: "p1",
      decision: "REJECTED",
      reviewedBy: "admin-1",
      rejectionReason: "ID does not match the business name",
    });
    expect(mockUpdateMany.mock.calls[0][0].data.rejectionReason).toBe(
      "ID does not match the business name"
    );

    mockUpdateMany.mockClear();
    await reviewPayoutAccount({ partnerId: "p1", decision: "VERIFIED", reviewedBy: "admin-1" });
    expect(mockUpdateMany.mock.calls[0][0].data.rejectionReason).toBeNull();
  });
});

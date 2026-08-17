/**
 * Commission splitting.
 *
 * The one property that actually matters to a partner reading their own
 * statement: platformFee + partnerPayout must equal the amount charged,
 * exactly, every time — a split that's off by a cent from what the guest
 * paid reads as the platform skimming, whatever the actual cause.
 */
const mockPartnerUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: { partner: { update: (...a: unknown[]) => mockPartnerUpdate(...a) } },
}));

import {
  splitCommission,
  setPartnerCommissionRate,
  resetPartnerCommissionRate,
  InvalidCommissionRateError,
  DEFAULT_COMMISSION_RATE,
} from "@/lib/commission";

beforeEach(() => jest.clearAllMocks());

describe("splitCommission", () => {
  it("splits a clean amount at the default 5%", () => {
    expect(splitCommission(1000)).toEqual({ platformFee: 50, partnerPayout: 950 });
  });

  it("splits at an explicit rate", () => {
    expect(splitCommission(1000, 10)).toEqual({ platformFee: 100, partnerPayout: 900 });
  });

  it("always adds back up to the original amount, even with awkward rounding", () => {
    // 33.33 is exactly the kind of number naive rounding drifts on.
    for (const amount of [33.33, 999.99, 1234.56, 0.03, 17]) {
      for (const rate of [5, 5.5, 12.75, 33.333]) {
        const { platformFee, partnerPayout } = splitCommission(amount, rate);
        expect(Math.round((platformFee + partnerPayout) * 100) / 100).toBeCloseTo(amount, 2);
      }
    }
  });

  it("a 0% rate pays the partner everything", () => {
    expect(splitCommission(500, 0)).toEqual({ platformFee: 0, partnerPayout: 500 });
  });

  it("a 100% rate pays the partner nothing", () => {
    expect(splitCommission(500, 100)).toEqual({ platformFee: 500, partnerPayout: 0 });
  });

  it("rejects a negative rate", () => {
    expect(() => splitCommission(500, -1)).toThrow(InvalidCommissionRateError);
  });

  it("rejects a rate over 100", () => {
    expect(() => splitCommission(500, 101)).toThrow(InvalidCommissionRateError);
  });

  it("rejects a non-finite rate", () => {
    expect(() => splitCommission(500, NaN)).toThrow(InvalidCommissionRateError);
  });
});

describe("setPartnerCommissionRate", () => {
  it("writes the rate with who and when", async () => {
    await setPartnerCommissionRate({ partnerId: "p1", rate: 8, actedBy: "admin-1" });
    expect(mockPartnerUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        commissionRate: 8,
        commissionSetBy: "admin-1",
        commissionSetAt: expect.any(Date),
      }),
    });
  });

  it("refuses an out-of-range rate before touching the database", async () => {
    await expect(
      setPartnerCommissionRate({ partnerId: "p1", rate: 150, actedBy: "admin-1" })
    ).rejects.toThrow(InvalidCommissionRateError);
    expect(mockPartnerUpdate).not.toHaveBeenCalled();
  });
});

describe("resetPartnerCommissionRate", () => {
  it("returns the partner to the standard rate", async () => {
    await resetPartnerCommissionRate({ partnerId: "p1", actedBy: "admin-1" });
    expect(mockPartnerUpdate).toHaveBeenCalledWith({
      where: { id: "p1" },
      data: expect.objectContaining({
        commissionRate: DEFAULT_COMMISSION_RATE,
        commissionSetBy: "admin-1",
      }),
    });
  });
});

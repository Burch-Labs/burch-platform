/**
 * Partner suspension.
 *
 * Suspending hides a real business's listings and stops their money, so the
 * rules worth pinning are the ones that keep it deliberate and reversible: a
 * reason is always required, the change is conditional so two admins cannot
 * overwrite each other, and lifting a suspension leaves no residue behind.
 */
const mockUpdateMany = jest.fn();
const mockPartnerFindUnique = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner: {
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
      findUnique: (...a: unknown[]) => mockPartnerFindUnique(...a),
    },
    payoutAccount: { upsert: jest.fn(), updateMany: jest.fn() },
  },
}));

import { setPartnerSuspension, getPayoutEligibility } from "@/lib/payouts";

beforeEach(() => {
  jest.clearAllMocks();
  mockUpdateMany.mockResolvedValue({ count: 1 });
});

describe("setPartnerSuspension", () => {
  it("refuses to suspend without a reason", async () => {
    // The partner sees the reason. Without one they cannot put it right.
    await expect(
      setPartnerSuspension({ partnerId: "p1", suspend: true, actedBy: "admin-1" })
    ).rejects.toThrow(/reason/i);
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a reason of only whitespace", async () => {
    await expect(
      setPartnerSuspension({ partnerId: "p1", suspend: true, actedBy: "admin-1", reason: "   " })
    ).rejects.toThrow(/reason/i);
  });

  it("records who suspended, when, and why", async () => {
    await setPartnerSuspension({
      partnerId: "p1",
      suspend: true,
      actedBy: "admin-1",
      reason: "Listing a property they do not operate",
    });
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: "SUSPENDED",
          suspendedBy: "admin-1",
          suspendedReason: "Listing a property they do not operate",
          suspendedAt: expect.any(Date),
        }),
      })
    );
  });

  it("only suspends a partner not already suspended", async () => {
    // Otherwise a second admin overwrites the first one's reason and timestamp.
    await setPartnerSuspension({ partnerId: "p1", suspend: true, actedBy: "a", reason: "x" });
    expect(mockUpdateMany.mock.calls[0][0].where.status).toEqual({ not: "SUSPENDED" });
  });

  it("only reinstates a partner who is suspended", async () => {
    await setPartnerSuspension({ partnerId: "p1", suspend: false, actedBy: "a" });
    expect(mockUpdateMany.mock.calls[0][0].where.status).toBe("SUSPENDED");
  });

  it("clears the reason and audit fields on reinstatement", async () => {
    // Stale suspension text on an active partner would be shown to them.
    await setPartnerSuspension({ partnerId: "p1", suspend: false, actedBy: "admin-1" });
    expect(mockUpdateMany.mock.calls[0][0].data).toEqual({
      status: "APPROVED",
      suspendedAt: null,
      suspendedReason: null,
      suspendedBy: null,
    });
  });

  it("reports when nothing changed", async () => {
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });
    await expect(
      setPartnerSuspension({ partnerId: "p1", suspend: true, actedBy: "a", reason: "x" })
    ).resolves.toEqual({ changed: false });
  });

  it("does not need a reason to reinstate", async () => {
    await expect(
      setPartnerSuspension({ partnerId: "p1", suspend: false, actedBy: "admin-1" })
    ).resolves.toEqual({ changed: true });
  });
});

describe("suspension and payouts together", () => {
  it("stops payouts even when the payout account is verified", async () => {
    // The whole point of suspending someone mid-fraud.
    mockPartnerFindUnique.mockResolvedValueOnce({
      status: "SUSPENDED",
      payoutAccount: { status: "VERIFIED" },
    });
    await expect(getPayoutEligibility("p1")).resolves.toEqual({
      eligible: false,
      reason: "partner-suspended",
    });
  });

  it("restores eligibility once reinstated", async () => {
    mockPartnerFindUnique.mockResolvedValueOnce({
      status: "APPROVED",
      payoutAccount: { status: "VERIFIED" },
    });
    await expect(getPayoutEligibility("p1")).resolves.toEqual({ eligible: true, reason: null });
  });
});

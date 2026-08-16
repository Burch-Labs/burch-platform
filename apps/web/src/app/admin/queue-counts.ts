import { prisma } from "@/lib/prisma";

/** Waiting-work counts for the admin tab bar. */
export async function getQueueCounts() {
  const [payouts, claims] = await Promise.all([
    prisma.payoutAccount.count({ where: { status: "SUBMITTED" } }),
    prisma.venueClaim.count({ where: { status: "NEW" } }),
  ]);
  return {
    "/admin/payouts": payouts,
    "/admin/claims": claims,
  };
}

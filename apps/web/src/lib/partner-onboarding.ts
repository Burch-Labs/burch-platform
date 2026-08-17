import { prisma } from "./prisma";

/**
 * Gets a user's partner profile, creating one if this is their first time
 * listing anything. Shared by /partner/onboarding and the public event
 * submission flow — both are "someone with no partner profile wants one,"
 * just reached from different starting points.
 *
 * Promotes a CUSTOMER to PARTNER on creation so the new profile's owner can
 * reach /partner afterward. Never demotes an ADMIN/SUPER_ADMIN — an admin who
 * submits an event to try the flow stays an admin.
 */
export async function findOrCreatePartner(userId: string, businessName: string) {
  const existing = await prisma.partner.findUnique({ where: { userId } });
  if (existing) return existing;

  const user = await prisma.user.findUnique({ where: { id: userId }, select: { role: true } });

  return prisma.$transaction(async (tx) => {
    const partner = await tx.partner.create({
      data: { userId, name: businessName },
    });
    if (user?.role === "CUSTOMER") {
      await tx.user.update({ where: { id: userId }, data: { role: "PARTNER" } });
    }
    return partner;
  });
}

import { prisma } from "@/lib/prisma";

export type ActivityItem = {
  id: string;
  at: Date;
  emoji: string;
  text: string;
  href?: string;
};

/**
 * A single merged, time-ordered feed across the actions that make up "what
 * happened on the platform" — the thing an admin actually wants on landing,
 * rather than five separate queues to check one at a time.
 *
 * Each source is fetched independently (there's no one table these all live
 * in) and merged in memory. `take` on each source is generous relative to
 * `limit` so a burst in one category can't starve the others out of the feed.
 */
export async function getRecentActivity(limit = 25): Promise<ActivityItem[]> {
  const fetchLimit = Math.max(limit, 15);

  const [events, reviewedEvents, partners, bookings, claims] = await Promise.all([
    prisma.event.findMany({
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: { id: true, title: true, createdAt: true, partner: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: { reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: fetchLimit,
      select: { id: true, title: true, reviewedAt: true, approvalStatus: true },
    }),
    prisma.partner.findMany({
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: { id: true, name: true, createdAt: true },
    }),
    prisma.booking.findMany({
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: {
        id: true, type: true, totalAmount: true, currency: true, createdAt: true,
        event: { select: { title: true } },
        hotel: { select: { name: true } },
        restaurant: { select: { name: true } },
      },
    }),
    prisma.venueClaim.findMany({
      orderBy: { createdAt: "desc" },
      take: fetchLimit,
      select: { id: true, venueName: true, contactName: true, createdAt: true },
    }),
  ]);

  const items: ActivityItem[] = [
    ...events.map((e) => ({
      id: `event-${e.id}`,
      at: e.createdAt,
      emoji: "🎉",
      text: `${e.partner.name} submitted "${e.title}"`,
      href: "/admin/events",
    })),
    ...reviewedEvents
      .filter((e): e is typeof e & { reviewedAt: Date } => e.reviewedAt !== null)
      .map((e) => ({
        id: `event-review-${e.id}`,
        at: e.reviewedAt,
        emoji: e.approvalStatus === "APPROVED" ? "✅" : "🚫",
        text: `"${e.title}" was ${e.approvalStatus === "APPROVED" ? "approved" : "rejected"}`,
        href: "/admin/events",
      })),
    ...partners.map((p) => ({
      id: `partner-${p.id}`,
      at: p.createdAt,
      emoji: "🏢",
      text: `${p.name} joined as a partner`,
      href: "/admin/partners",
    })),
    ...bookings.map((b) => {
      const venue = b.event?.title ?? b.hotel?.name ?? b.restaurant?.name ?? "a listing";
      return {
        id: `booking-${b.id}`,
        at: b.createdAt,
        emoji: "🎫",
        text: `New ${b.type.toLowerCase()} booking for "${venue}" — ${b.currency} ${Number(b.totalAmount).toLocaleString()}`,
        href: "/admin/payouts",
      };
    }),
    ...claims.map((c) => ({
      id: `claim-${c.id}`,
      at: c.createdAt,
      emoji: "📣",
      text: `${c.contactName} claimed "${c.venueName}"`,
      href: "/admin/claims",
    })),
  ];

  return items.sort((a, b) => b.at.getTime() - a.at.getTime()).slice(0, limit);
}

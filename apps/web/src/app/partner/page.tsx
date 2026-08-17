import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PayoutStatusCard } from "@/components/partner/PayoutStatusCard";
import { NavBar } from "@/components/layout/NavBar";
import { ConfigHealthBanner } from "@/components/partner/ConfigHealthBanner";
import Link from "next/link";
import { isAdminRole } from "@/lib/roles";

export default async function PartnerPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    include: {
      _count: { select: { events: true, hotels: true, restaurants: true, clubs: true } },
      payoutAccount: { select: { status: true, rejectionReason: true } },
      hotels:      { select: { id: true } },
      events:      { select: { id: true } },
      restaurants: { select: { id: true } },
    },
  });

  const partnerShare = partner ? 100 - Number(partner.commissionRate) : null;

  // Count pending bookings and table reservations for this partner
  let pendingCount = 0;
  if (partner) {
    const hotelIds      = partner.hotels.map((h) => h.id);
    const eventIds      = partner.events.map((e) => e.id);
    const restaurantIds = partner.restaurants.map((r) => r.id);

    const bookingOrFilter = [
      hotelIds.length      ? { hotelId:      { in: hotelIds }      } : undefined,
      eventIds.length      ? { eventId:      { in: eventIds }      } : undefined,
      restaurantIds.length ? { restaurantId: { in: restaurantIds } } : undefined,
    ].filter(Boolean) as object[];

    if (bookingOrFilter.length > 0) {
      const [pendingBookings, pendingReservations] = await Promise.all([
        prisma.booking.count({ where: { status: "PENDING", OR: bookingOrFilter } }),
        restaurantIds.length
          ? prisma.tableReservation.count({ where: { status: "PENDING", restaurantId: { in: restaurantIds } } })
          : Promise.resolve(0),
      ]);
      pendingCount = pendingBookings + pendingReservations;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <ConfigHealthBanner />
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Partner Portal</h1>
            <p className="text-sm text-gray-500 mt-1">
              {partner ? partner.name : "Complete your partner profile to get started"}
            </p>
          </div>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
            ← Dashboard
          </Link>
        </div>

        {!partner ? (
          /* Onboarding CTA */
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-4xl mb-4">🏢</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Set up your business</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              Create your partner profile to start listing events, hotels, and restaurants on dontbeboring.
            </p>
            <Link
              href="/partner/onboarding"
              className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Get started
            </Link>
          </div>
        ) : (
          <>
            {/* Listing is open from signup, so the only thing still gated is
                money. This is the banner that matters now. */}
            <PayoutStatusCard
              status={partner.payoutAccount?.status ?? null}
              rejectionReason={partner.payoutAccount?.rejectionReason}
            />

            {partnerShare !== null && (
              <div className="mb-6 rounded-xl bg-orange-50 border border-orange-100 px-5 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-orange-900">
                    You keep {partnerShare}% of every sale
                  </p>
                  <p className="text-xs text-orange-700 mt-0.5">
                    dontbeboring&apos;s share is {Number(partner.commissionRate)}% — paid out to you directly.
                  </p>
                </div>
              </div>
            )}

            {partner.status === "SUSPENDED" && (
              <div className="mb-6 rounded-xl bg-red-50 border border-red-200 px-5 py-4">
                <p className="text-sm font-medium text-red-800">Account suspended</p>
                <p className="text-sm text-red-700 mt-0.5">
                  Your listings are hidden and payouts are stopped. Contact support.
                </p>
              </div>
            )}

            {/* Listing stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Events", count: partner._count.events, href: "/partner/events", emoji: "🎉" },
                { label: "Hotels", count: partner._count.hotels, href: "/partner/hotels", emoji: "🏨" },
                { label: "Restaurants", count: partner._count.restaurants, href: "/partner/restaurants", emoji: "🍽️" },
                { label: "Clubs", count: partner._count.clubs, href: "/partner/clubs", emoji: "⛳" },
              ].map(({ label, count, href, emoji }) => (
                <Link
                  key={label}
                  href={href}
                  className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-sm transition group"
                >
                  <span className="text-2xl mb-2 block">{emoji}</span>
                  <p className="text-3xl font-bold text-gray-900 group-hover:text-orange-600 transition">
                    {count}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">{label}</p>
                </Link>
              ))}
            </div>

            {/* Bookings shortcut */}
            <Link
              href="/partner/bookings"
              className="mb-4 flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4 hover:border-orange-300 hover:shadow-sm transition group"
            >
              <div className="flex items-center gap-3">
                <span className="text-2xl">📋</span>
                <div>
                  <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition flex items-center gap-2">
                    Manage Bookings
                    {pendingCount > 0 && (
                      <span className="inline-flex items-center justify-center bg-amber-500 text-white text-xs font-bold px-2 py-0.5 rounded-full min-w-[1.25rem]">
                        {pendingCount}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {pendingCount > 0
                      ? `${pendingCount} pending booking${pendingCount !== 1 ? "s" : ""} need${pendingCount === 1 ? "s" : ""} attention`
                      : "View, confirm, and cancel bookings across all your properties"}
                  </p>
                </div>
              </div>
              <span className="text-gray-400 group-hover:text-orange-500 transition">→</span>
            </Link>

            {/* Quick actions */}
            <div className="bg-white rounded-2xl border border-gray-200 p-6">
              <h2 className="font-semibold text-gray-900 mb-4">Quick actions</h2>
              <div className="flex flex-wrap gap-3">
                {[
                  { label: "Add event", href: "/partner/events/new" },
                  { label: "Add hotel", href: "/partner/hotels/new" },
                  { label: "Add restaurant", href: "/partner/restaurants/new" },
                  { label: "Add golf club", href: "/partner/clubs/new" },
                ].map(({ label, href }) => (
                  <Link
                    key={label}
                    href={href}
                    className="border border-gray-200 text-sm text-gray-700 px-4 py-2 rounded-lg hover:border-orange-300 hover:text-orange-600 transition"
                  >
                    + {label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}

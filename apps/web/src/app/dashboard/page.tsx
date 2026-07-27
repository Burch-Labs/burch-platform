import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { prisma } from "@/lib/prisma";
import { BookingStatus, ReservationStatus } from "@prisma/client";
import { CancelButton } from "./CancelButton";

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmt(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: BookingStatus | ReservationStatus }) {
  const map: Record<string, string> = {
    PENDING:   "bg-amber-50 text-amber-700 border-amber-200",
    CONFIRMED: "bg-green-50 text-green-700 border-green-200",
    CANCELLED: "bg-red-50 text-red-700 border-red-200",
    COMPLETED: "bg-gray-50 text-gray-500 border-gray-200",
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${map[status] ?? map.PENDING}`}>
      {status.charAt(0) + status.slice(1).toLowerCase()}
    </span>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title, href, count }: { title: string; href: string; count: number }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h2 className="text-base font-semibold text-gray-900">
        {title}
        {count > 0 && (
          <span className="ml-2 text-xs font-normal text-gray-400">({count})</span>
        )}
      </h2>
      <Link href={href} className="text-xs text-orange-600 hover:text-orange-700 font-medium">
        Browse →
      </Link>
    </div>
  );
}

// ─── Empty slot ───────────────────────────────────────────────────────────────

function EmptyRow({ emoji, label, href }: { emoji: string; label: string; href: string }) {
  return (
    <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
      <p className="text-2xl mb-1">{emoji}</p>
      <p className="text-sm text-gray-500">No {label} yet.</p>
      <Link href={href} className="mt-2 inline-block text-xs text-orange-600 hover:underline font-medium">
        Browse {label}
      </Link>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const { id: userId, role, name } = session.user;

  // ── Customer data ──────────────────────────────────────────────────────────
  const [hotelBookings, eventBookings, reservations] =
    role === "CUSTOMER"
      ? await Promise.all([
          prisma.booking.findMany({
            where: { userId, type: "HOTEL" },
            include: {
              hotel: { select: { id: true, name: true, city: true, imageUrl: true } },
              room:  { select: { name: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.booking.findMany({
            where: { userId, type: "EVENT" },
            include: {
              event: { select: { id: true, title: true, startDate: true, city: true, imageUrl: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
          prisma.tableReservation.findMany({
            where: { userId },
            include: {
              restaurant: { select: { id: true, name: true, city: true, imageUrl: true } },
            },
            orderBy: { createdAt: "desc" },
            take: 5,
          }),
        ])
      : [[], [], []];

  // ── Partner data ───────────────────────────────────────────────────────────
  const partnerSummary =
    role === "PARTNER"
      ? await prisma.partner.findUnique({
          where: { userId },
          include: {
            hotels: {
              where: { published: true },
              select: {
                id: true,
                name: true,
                _count: { select: { bookings: true } },
              },
            },
            restaurants: {
              where: { published: true },
              select: {
                id: true,
                name: true,
                _count: { select: { reservations: true, bookings: true } },
              },
            },
            events: {
              where: { published: true },
              select: {
                id: true,
                title: true,
                startDate: true,
                _count: { select: { bookings: true } },
              },
            },
          },
        })
      : null;

  const recentPartnerBookings =
    role === "PARTNER" && partnerSummary
      ? await prisma.booking.findMany({
          where: {
            OR: [
              partnerSummary.hotels.length
                ? { hotelId: { in: partnerSummary.hotels.map((h) => h.id) } }
                : undefined,
              partnerSummary.events.length
                ? { eventId: { in: partnerSummary.events.map((e) => e.id) } }
                : undefined,
              partnerSummary.restaurants.length
                ? { restaurantId: { in: partnerSummary.restaurants.map((r) => r.id) } }
                : undefined,
            ].filter(Boolean) as object[],
          },
          include: {
            user: { select: { name: true, email: true } },
            hotel: { select: { name: true } },
            event: { select: { title: true } },
            restaurant: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

  const recentPartnerReservations =
    role === "PARTNER" && partnerSummary && partnerSummary.restaurants.length
      ? await prisma.tableReservation.findMany({
          where: {
            restaurantId: { in: partnerSummary.restaurants.map((r) => r.id) },
          },
          include: {
            restaurant: { select: { name: true } },
          },
          orderBy: { date: "desc" },
          take: 10,
        })
      : [];

  // ── Admin data ─────────────────────────────────────────────────────────────
  const adminStats =
    role === "ADMIN"
      ? await prisma.$transaction([
          prisma.booking.count(),
          prisma.booking.count({ where: { status: "CONFIRMED" } }),
          prisma.booking.count({ where: { status: "PENDING" } }),
          prisma.tableReservation.count(),
          prisma.tableReservation.count({ where: { status: "CONFIRMED" } }),
        ])
      : null;

  const recentAdminBookings =
    role === "ADMIN"
      ? await prisma.booking.findMany({
          include: {
            user: { select: { name: true, email: true } },
            hotel: { select: { name: true } },
            event: { select: { title: true } },
            restaurant: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 10,
        })
      : [];

  // ── Nav links ──────────────────────────────────────────────────────────────
  const customerLinks = [
    { emoji: "🎉", label: "Events",      href: "/events",      desc: "Live shows, concerts & more" },
    { emoji: "🏨", label: "Hotels",      href: "/hotels",      desc: "Find the perfect stay" },
    { emoji: "🍽️", label: "Restaurants", href: "/restaurants", desc: "Book a table" },
  ];

  const partnerLinks = [
    { emoji: "📊", label: "Overview",        href: "/partner",             desc: "Your business at a glance" },
    { emoji: "🎉", label: "My Events",       href: "/partner/events",      desc: "Manage event listings" },
    { emoji: "🏨", label: "My Hotels",       href: "/partner/hotels",      desc: "Manage hotel listings" },
    { emoji: "🍽️", label: "My Restaurants",  href: "/partner/restaurants", desc: "Manage restaurant listings" },
  ];

  const adminLinks = [
    { emoji: "🛡️", label: "Admin Panel", href: "/admin",           desc: "Platform management" },
    { emoji: "👥", label: "Users",       href: "/admin/users",     desc: "Manage all users" },
    { emoji: "🤝", label: "Partners",    href: "/admin/partners",  desc: "Review & approve partners" },
    { emoji: "📈", label: "Analytics",   href: "/admin/analytics", desc: "Platform statistics" },
  ];

  const links =
    role === "ADMIN" ? adminLinks : role === "PARTNER" ? partnerLinks : customerLinks;

  const greeting =
    role === "ADMIN"   ? "Admin dashboard" :
    role === "PARTNER" ? "Partner dashboard" :
                         "Welcome back";

  const subtitle =
    role === "ADMIN"   ? "Manage the Burch platform." :
    role === "PARTNER" ? "Manage your listings and view bookings." :
                         "Your bookings and reservations at a glance.";

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {greeting}{name ? `, ${name}` : ""}!
          </h1>
          <p className="text-gray-500 mt-1 text-sm">{subtitle}</p>
        </div>

        {/* Email verification banner */}
        {!session.user.emailVerified && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Verify your email address</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Some features are limited until you verify your email.{" "}
                <Link href="/auth/verify-email" className="underline font-medium">
                  Resend verification email
                </Link>
              </p>
            </div>
          </div>
        )}

        {/* Quick-nav cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {links.map(({ emoji, label, href, desc }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-sm transition group"
            >
              <span className="text-3xl mb-3 block">{emoji}</span>
              <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        {/* ── CUSTOMER — booking history ──────────────────────────── */}
        {role === "CUSTOMER" && (
          <div className="space-y-10">

            {/* Hotel bookings */}
            <div>
              <SectionHeader title="Hotel stays" href="/hotels" count={hotelBookings.length} />
              {hotelBookings.length === 0 ? (
                <EmptyRow emoji="🏨" label="hotels" href="/hotels" />
              ) : (
                <div className="space-y-3">
                  {hotelBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                    >
                      {b.hotel?.imageUrl && (
                        <img
                          src={b.hotel.imageUrl}
                          alt={b.hotel.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {b.hotel?.name ?? "Hotel"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.hotel?.city}
                          {b.room ? ` · ${b.room.name}` : ""}
                          {b.checkIn
                            ? ` · ${new Date(b.checkIn).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`
                            : ""}
                          {b.checkOut
                            ? ` – ${new Date(b.checkOut).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`
                            : ""}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={b.status} />
                        <p className="text-xs font-medium text-gray-700">
                          {b.currency} {Number(b.totalAmount).toLocaleString()}
                        </p>
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <CancelButton id={b.id} kind="booking" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Event bookings */}
            <div>
              <SectionHeader title="Event tickets" href="/events" count={eventBookings.length} />
              {eventBookings.length === 0 ? (
                <EmptyRow emoji="🎉" label="events" href="/events" />
              ) : (
                <div className="space-y-3">
                  {eventBookings.map((b) => (
                    <div
                      key={b.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                    >
                      {b.event?.imageUrl && (
                        <img
                          src={b.event.imageUrl}
                          alt={b.event.title}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {b.event?.title ?? "Event"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.event?.city}
                          {b.event?.startDate
                            ? ` · ${new Date(b.event.startDate).toLocaleDateString("en-GB", {
                                day: "numeric", month: "short", year: "numeric",
                              })}`
                            : ""}
                          {` · ${b.quantity} ticket${b.quantity !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={b.status} />
                        <p className="text-xs font-medium text-gray-700">
                          {b.currency} {Number(b.totalAmount).toLocaleString()}
                        </p>
                        {(b.status === "PENDING" || b.status === "CONFIRMED") && (
                          <CancelButton id={b.id} kind="booking" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Restaurant reservations */}
            <div>
              <SectionHeader title="Restaurant reservations" href="/restaurants" count={reservations.length} />
              {reservations.length === 0 ? (
                <EmptyRow emoji="🍽️" label="restaurants" href="/restaurants" />
              ) : (
                <div className="space-y-3">
                  {reservations.map((r) => (
                    <div
                      key={r.id}
                      className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                    >
                      {r.restaurant?.imageUrl && (
                        <img
                          src={r.restaurant.imageUrl}
                          alt={r.restaurant.name}
                          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                        />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 truncate">
                          {r.restaurant?.name ?? "Restaurant"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {r.restaurant?.city}
                          {` · ${new Date(r.date).toLocaleDateString("en-GB", {
                            weekday: "short", day: "numeric", month: "short", year: "numeric",
                          })}`}
                          {` at ${fmtTime(r.date)}`}
                          {` · ${r.partySize} guest${r.partySize !== 1 ? "s" : ""}`}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                        <StatusBadge status={r.status} />
                        {(r.status === "PENDING" || r.status === "CONFIRMED") && (
                          <CancelButton id={r.id} kind="reservation" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── PARTNER: property booking summary ───────────────────────────── */}
        {role === "PARTNER" && (
          <div className="space-y-10">

            {/* Stats strip */}
            {partnerSummary && (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  emoji="🏨"
                  label="Hotel bookings"
                  value={partnerSummary.hotels.reduce((s, h) => s + h._count.bookings, 0)}
                />
                <StatCard
                  emoji="🍽️"
                  label="Table reservations"
                  value={partnerSummary.restaurants.reduce(
                    (s, r) => s + r._count.reservations,
                    0
                  )}
                />
                <StatCard
                  emoji="🎉"
                  label="Event bookings"
                  value={partnerSummary.events.reduce((s, e) => s + e._count.bookings, 0)}
                />
              </div>
            )}

            {/* Recent bookings table */}
            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent bookings</h2>
              {recentPartnerBookings.length === 0 ? (
                <EmptyCard message="No bookings yet — publish a listing to start receiving reservations." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {recentPartnerBookings.map((b) => (
                    <PartnerBookingRow key={b.id} booking={b} />
                  ))}
                </div>
              )}
            </section>

            {/* Recent table reservations */}
            {recentPartnerReservations.length > 0 && (
              <section>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent table reservations</h2>
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {recentPartnerReservations.map((r) => (
                    <PartnerReservationRow key={r.id} reservation={r} />
                  ))}
                </div>
              </section>
            )}

            <Link
              href="/partner"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition"
            >
              Go to Partner Portal →
            </Link>
          </div>
        )}

        {/* ── ADMIN: platform booking overview ────────────────────────────── */}
        {role === "ADMIN" && adminStats && (
          <div className="space-y-10">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
              <StatCard emoji="📋" label="Total bookings" value={adminStats[0]} />
              <StatCard emoji="✅" label="Confirmed" value={adminStats[1]} />
              <StatCard emoji="⏳" label="Pending" value={adminStats[2]} />
              <StatCard emoji="🍽️" label="Reservations" value={adminStats[3]} />
              <StatCard emoji="🟢" label="Res. confirmed" value={adminStats[4]} />
            </div>

            <section>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent bookings</h2>
              {recentAdminBookings.length === 0 ? (
                <EmptyCard message="No bookings recorded yet." />
              ) : (
                <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                  {recentAdminBookings.map((b) => (
                    <PartnerBookingRow key={b.id} booking={b} showUser />
                  ))}
                </div>
              )}
            </section>

            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-orange-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-orange-700 transition"
            >
              Open Admin Panel →
            </Link>
          </div>
        )}

      </main>
    </div>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

type PartnerBookingRow = Awaited<ReturnType<typeof prisma.booking.findMany<{
  include: {
    user: { select: { name: true; email: true } };
    hotel: { select: { name: true } };
    event: { select: { title: true } };
    restaurant: { select: { name: true } };
  };
}>>>[number];

function PartnerBookingRow({
  booking: b,
  showUser = false,
}: {
  booking: PartnerBookingRow;
  showUser?: boolean;
}) {
  const isHotel = b.type === "HOTEL";
  const isEvent = b.type === "EVENT";
  const name = isHotel ? b.hotel?.name : isEvent ? b.event?.title : b.restaurant?.name;
  const typeEmoji = isHotel ? "🏨" : isEvent ? "🎉" : "🍽️";
  const dateRange = isHotel
    ? `${fmt(b.checkIn)} – ${fmt(b.checkOut)}`
    : fmt(b.createdAt);

  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">{typeEmoji}</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{name ?? "—"}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {showUser && b.user ? `${b.user.name ?? b.user.email} · ` : ""}
            {dateRange}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <StatusBadge status={b.status} />
        <span className="text-xs text-gray-400">
          {b.currency} {Number(b.totalAmount).toLocaleString()}
        </span>
      </div>
    </div>
  );
}

type PartnerResRow = Awaited<ReturnType<typeof prisma.tableReservation.findMany<{
  include: { restaurant: { select: { name: true } } };
}>>>[number];

function PartnerReservationRow({ reservation: r }: { reservation: PartnerResRow }) {
  return (
    <div className="px-5 py-4 flex items-center justify-between gap-4">
      <div className="flex items-center gap-3 min-w-0">
        <span className="text-xl shrink-0">🍽️</span>
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {r.restaurant?.name ?? "—"}
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            {r.name} · {fmt(r.date)} at {fmtTime(r.date)} · {r.partySize} guest
            {r.partySize !== 1 ? "s" : ""}
          </p>
        </div>
      </div>
      <StatusBadge status={r.status} />
    </div>
  );
}

function StatCard({ emoji, label, value }: { emoji: string; label: string; value: number }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5">
      <span className="text-2xl">{emoji}</span>
      <p className="text-2xl font-bold text-gray-900 mt-2">{value.toLocaleString()}</p>
      <p className="text-xs text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

function EmptyCard({ message }: { message: string }) {
  return (
    <div className="bg-white rounded-2xl border border-dashed border-gray-200 py-10 text-center px-6">
      <p className="text-sm text-gray-500">{message}</p>
    </div>
  );
}

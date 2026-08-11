import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { BookingStatus, ReservationStatus } from "@prisma/client";
import { PartnerActionButtons } from "@/app/dashboard/PartnerActionButtons";
import { BookingsFilter } from "./BookingsFilter";
import Link from "next/link";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(date: Date | null | undefined) {
  if (!date) return "—";
  return date.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function fmtTime(date: Date) {
  return date.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

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

// ─── Page ─────────────────────────────────────────────────────────────────────

interface PageProps {
  searchParams: Promise<{ status?: string; property?: string }>;
}

export default async function PartnerBookingsPage({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const { status: statusParam, property: propertyParam } = await searchParams;

  // ── Load partner and their properties ──────────────────────────────────────
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    include: {
      hotels:      { where: { published: true }, select: { id: true, name: true } },
      events:      { where: { published: true }, select: { id: true, title: true } },
      restaurants: { where: { published: true }, select: { id: true, name: true } },
    },
  });

  if (!partner) redirect("/partner");

  // ── Build property list for filter UI ──────────────────────────────────────
  const properties = [
    ...partner.hotels.map((h) => ({ id: h.id, name: h.name, kind: "hotel" as const })),
    ...partner.events.map((e) => ({ id: e.id, name: e.title, kind: "event" as const })),
    ...partner.restaurants.map((r) => ({ id: r.id, name: r.name, kind: "restaurant" as const })),
  ];

  // ── Build booking where clause ──────────────────────────────────────────────
  const validStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  const statusFilter =
    statusParam && validStatuses.includes(statusParam as BookingStatus)
      ? (statusParam as BookingStatus)
      : undefined;

  // Figure out which property IDs are in scope
  const hotelIds      = partner.hotels.map((h) => h.id);
  const eventIds      = partner.events.map((e) => e.id);
  const restaurantIds = partner.restaurants.map((r) => r.id);

  // When a specific property is selected, narrow to just that one
  const selectedHotelIds      = propertyParam
    ? hotelIds.filter((id) => id === propertyParam)
    : hotelIds;
  const selectedEventIds      = propertyParam
    ? eventIds.filter((id) => id === propertyParam)
    : eventIds;
  const selectedRestaurantIds = propertyParam
    ? restaurantIds.filter((id) => id === propertyParam)
    : restaurantIds;

  // Build the OR filter for bookings
  const bookingOrFilter = [
    selectedHotelIds.length      ? { hotelId:      { in: selectedHotelIds }      } : undefined,
    selectedEventIds.length      ? { eventId:      { in: selectedEventIds }      } : undefined,
    selectedRestaurantIds.length ? { restaurantId: { in: selectedRestaurantIds } } : undefined,
  ].filter(Boolean) as object[];

  const noProperties = bookingOrFilter.length === 0;

  // ── Fetch status counts (unfiltered by status, respects property filter) ───
  const statusOrder: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];

  const [bookingCounts, reservationCounts] = noProperties
    ? [[], []]
    : await Promise.all([
        prisma.booking.groupBy({
          by: ["status"],
          where: { OR: bookingOrFilter },
          _count: { id: true },
        }),
        selectedRestaurantIds.length
          ? prisma.tableReservation.groupBy({
              by: ["status"],
              where: { restaurantId: { in: selectedRestaurantIds } },
              _count: { id: true },
            })
          : Promise.resolve([]),
      ]);

  // Merge booking + reservation counts per status
  const statusCounts: Record<string, number> = {};
  for (const row of bookingCounts) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + row._count.id;
  }
  for (const row of reservationCounts) {
    statusCounts[row.status] = (statusCounts[row.status] ?? 0) + row._count.id;
  }

  // ── Fetch bookings and reservations ────────────────────────────────────────
  const [bookings, reservations] = noProperties
    ? [[], []]
    : await Promise.all([
        prisma.booking.findMany({
          where: {
            ...(statusFilter ? { status: statusFilter } : {}),
            OR: bookingOrFilter,
          },
          include: {
            user:       { select: { name: true, email: true } },
            hotel:      { select: { name: true } },
            event:      { select: { title: true } },
            restaurant: { select: { name: true } },
          },
          orderBy: { createdAt: "desc" },
        }),
        // Only fetch reservations if restaurants are in scope (and no EVENT/HOTEL-only property filter)
        selectedRestaurantIds.length
          ? prisma.tableReservation.findMany({
              where: {
                restaurantId: { in: selectedRestaurantIds },
                ...(statusFilter
                  ? { status: statusFilter as unknown as ReservationStatus }
                  : {}),
              },
              include: {
                user:       { select: { name: true, email: true } },
                restaurant: { select: { name: true } },
              },
              orderBy: { date: "desc" },
            })
          : Promise.resolve([] as Awaited<ReturnType<typeof prisma.tableReservation.findMany<{
              include: {
                user:       { select: { name: true; email: true } };
                restaurant: { select: { name: true } };
              };
            }>>>),
      ]);

  const totalCount = bookings.length + reservations.length;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bookings</h1>
            <p className="text-sm text-gray-500 mt-1">
              All bookings and table reservations across your properties
            </p>
          </div>
          <div className="flex items-center gap-3">
            {!noProperties && selectedRestaurantIds.length > 0 && totalCount > 0 && (
              <a
                href={`/api/partner/bookings/export?${new URLSearchParams({
                  type: "reservation",
                  ...(statusParam   ? { status:   statusParam   } : {}),
                  ...(propertyParam ? { property: propertyParam } : {}),
                }).toString()}`}
                download="reservations-export.csv"
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                </svg>
                Export Reservations
              </a>
            )}
            {!noProperties && totalCount > 0 && (
              <a
                href={`/api/partner/bookings/export${
                  statusParam || propertyParam
                    ? `?${new URLSearchParams({
                        ...(statusParam   ? { status:   statusParam   } : {}),
                        ...(propertyParam ? { property: propertyParam } : {}),
                      }).toString()}`
                    : ""
                }`}
                download="bookings-export.csv"
                className="inline-flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2 rounded-xl hover:bg-gray-50 transition"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M8 12l4 4m0 0l4-4m-4 4V4" />
                </svg>
                Export CSV
              </a>
            )}
            <Link href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
              ← Partner Portal
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6">
          <BookingsFilter
            properties={properties}
            statusCounts={noProperties ? {} : statusCounts}
            statusOrder={statusOrder}
          />
        </div>

        {/* Summary count */}
        {totalCount > 0 && (
          <p className="text-xs text-gray-400 mb-4">
            {totalCount} result{totalCount !== 1 ? "s" : ""}
            {statusParam ? ` · ${statusParam.charAt(0) + statusParam.slice(1).toLowerCase()}` : ""}
          </p>
        )}

        {/* No properties at all */}
        {noProperties && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-8 py-12 text-center">
            <p className="text-3xl mb-3">🏢</p>
            <p className="text-sm font-medium text-gray-700 mb-1">No published properties yet</p>
            <p className="text-xs text-gray-400 mb-4">
              Add and publish a hotel, event, or restaurant to start receiving bookings.
            </p>
            <Link
              href="/partner"
              className="inline-block bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Go to Partner Portal
            </Link>
          </div>
        )}

        {/* No results for this filter */}
        {!noProperties && totalCount === 0 && (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-8 py-12 text-center">
            <p className="text-3xl mb-3">📭</p>
            <p className="text-sm font-medium text-gray-700 mb-1">No bookings found</p>
            <p className="text-xs text-gray-400">
              {statusParam
                ? `There are no ${statusParam.toLowerCase()} bookings matching your filters.`
                : "No bookings have been made against your properties yet."}
            </p>
          </div>
        )}

        {/* Bookings list */}
        {bookings.length > 0 && (
          <section className="mb-8">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Bookings ({bookings.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {bookings.map((b) => {
                const isHotel = b.type === "HOTEL";
                const isEvent = b.type === "EVENT";
                const propName = isHotel ? b.hotel?.name : isEvent ? b.event?.title : b.restaurant?.name;
                const typeEmoji = isHotel ? "🏨" : isEvent ? "🎉" : "🍽️";
                const dateLabel = isHotel
                  ? `${fmt(b.checkIn)} – ${fmt(b.checkOut)}`
                  : fmt(b.createdAt);

                return (
                  <div
                    key={b.id}
                    className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-xl shrink-0">{typeEmoji}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">
                          {propName ?? "—"}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5">
                          {b.user?.name ?? b.user?.email ?? "Guest"} · {dateLabel}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                      <span className="text-xs text-gray-400">
                        {b.currency} {Number(b.totalAmount).toLocaleString()}
                      </span>
                      <StatusBadge status={b.status} />
                      <PartnerActionButtons id={b.id} kind="booking" status={b.status} />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Reservations list */}
        {reservations.length > 0 && (
          <section>
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              Table Reservations ({reservations.length})
            </h2>
            <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
              {reservations.map((r) => (
                <div
                  key={r.id}
                  className="px-5 py-4 flex items-center justify-between gap-4 flex-wrap sm:flex-nowrap"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">🍽️</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {r.restaurant?.name ?? "Restaurant"}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {r.user?.name ?? r.user?.email ?? "Guest"} ·{" "}
                        {new Date(r.date).toLocaleDateString("en-GB", {
                          weekday: "short", day: "numeric", month: "short", year: "numeric",
                        })}{" "}
                        at {fmtTime(r.date)} · {r.partySize} guest{r.partySize !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 flex-wrap justify-end">
                    <StatusBadge status={r.status} />
                    <PartnerActionButtons id={r.id} kind="reservation" status={r.status} />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

      </main>
    </div>
  );
}

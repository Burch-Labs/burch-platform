import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { prisma } from "@/lib/prisma";
import { BookingStatus, ReservationStatus } from "@prisma/client";
import { CancelButton } from "../dashboard/CancelButton";

export const metadata = { title: "My bookings — dontbeboringKE" };

// ─── helpers ──────────────────────────────────────────────────────────────────

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

function cancellable(status: BookingStatus | ReservationStatus) {
  return status === "PENDING" || status === "CONFIRMED";
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function MyBookingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const userId = session.user.id;
  const now = new Date();

  const [hotelBookings, reservations] = await Promise.all([
    prisma.booking.findMany({
      where: { userId, type: "HOTEL" },
      include: {
        hotel: { select: { id: true, name: true, city: true, imageUrl: true } },
        room:  { select: { name: true } },
      },
      orderBy: [{ checkIn: "desc" }, { createdAt: "desc" }],
    }),
    prisma.tableReservation.findMany({
      where: { userId },
      include: {
        restaurant: { select: { id: true, name: true, city: true, imageUrl: true } },
      },
      orderBy: { date: "desc" },
    }),
  ]);

  const isUpcomingBooking = (b: (typeof hotelBookings)[number]) =>
    !!b.checkOut && b.checkOut >= now && b.status !== "CANCELLED" && b.status !== "COMPLETED";
  const isUpcomingReservation = (r: (typeof reservations)[number]) =>
    r.date >= now && r.status !== "CANCELLED" && r.status !== "COMPLETED";

  const upcomingBookings = hotelBookings.filter(isUpcomingBooking).sort(
    (a, b) => (a.checkIn?.getTime() ?? 0) - (b.checkIn?.getTime() ?? 0)
  );
  const pastBookings = hotelBookings.filter((b) => !isUpcomingBooking(b));
  const upcomingReservations = reservations
    .filter(isUpcomingReservation)
    .sort((a, b) => a.date.getTime() - b.date.getTime());
  const pastReservations = reservations.filter((r) => !isUpcomingReservation(r));

  const nothingYet = hotelBookings.length === 0 && reservations.length === 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My bookings</h1>
            <p className="text-gray-500 mt-1 text-sm">
              All your hotel stays and table reservations in one place.
            </p>
          </div>
          <Link href="/dashboard" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
            ← Back to dashboard
          </Link>
        </div>

        {nothingYet ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center">
            <p className="text-3xl mb-2">🧳</p>
            <p className="text-sm text-gray-600 font-medium">You have no bookings yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              When you book a hotel stay or reserve a table, it will show up here.
            </p>
            <div className="mt-4 flex items-center justify-center gap-3">
              <Link href="/hotels" className="text-xs font-medium text-orange-600 hover:underline">
                Browse hotels
              </Link>
              <span className="text-gray-300">·</span>
              <Link href="/restaurants" className="text-xs font-medium text-orange-600 hover:underline">
                Browse restaurants
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-12">
            {/* ── Upcoming ── */}
            <section>
              <h2 className="text-base font-semibold text-gray-900 mb-4">
                Upcoming
                <span className="ml-2 text-xs font-normal text-gray-400">
                  ({upcomingBookings.length + upcomingReservations.length})
                </span>
              </h2>
              {upcomingBookings.length === 0 && upcomingReservations.length === 0 ? (
                <p className="text-sm text-gray-400 bg-white rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
                  Nothing coming up. Time to plan your next outing!
                </p>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <HotelRow key={b.id} booking={b} showCancel={cancellable(b.status)} />
                  ))}
                  {upcomingReservations.map((r) => (
                    <ReservationRow key={r.id} reservation={r} showCancel={cancellable(r.status)} />
                  ))}
                </div>
              )}
            </section>

            {/* ── Past & cancelled ── */}
            {(pastBookings.length > 0 || pastReservations.length > 0) && (
              <section>
                <h2 className="text-base font-semibold text-gray-900 mb-4">
                  Past &amp; cancelled
                  <span className="ml-2 text-xs font-normal text-gray-400">
                    ({pastBookings.length + pastReservations.length})
                  </span>
                </h2>
                <div className="space-y-3">
                  {pastBookings.map((b) => (
                    <HotelRow key={b.id} booking={b} showCancel={false} />
                  ))}
                  {pastReservations.map((r) => (
                    <ReservationRow key={r.id} reservation={r} showCancel={false} />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

// ─── Rows ─────────────────────────────────────────────────────────────────────

type HotelBooking = Awaited<ReturnType<typeof prisma.booking.findMany<{
  include: {
    hotel: { select: { id: true; name: true; city: true; imageUrl: true } };
    room:  { select: { name: true } };
  };
}>>>[number];

function HotelRow({ booking: b, showCancel }: { booking: HotelBooking; showCancel: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      {b.hotel?.imageUrl ? (
        <img
          src={b.hotel.imageUrl}
          alt={b.hotel.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <span className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">🏨</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {b.hotel?.name ?? "Hotel"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {b.hotel?.city}
          {b.room ? ` · ${b.room.name}` : ""}
          {b.checkIn ? ` · ${fmt(b.checkIn)}` : ""}
          {b.checkOut ? ` – ${fmt(b.checkOut)}` : ""}
          {b.notes ? ` · ${b.notes}` : ""}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={b.status} />
        <p className="text-xs font-medium text-gray-700">
          {b.currency} {Number(b.totalAmount).toLocaleString()}
        </p>
        {showCancel && <CancelButton id={b.id} kind="booking" />}
      </div>
    </div>
  );
}

type Reservation = Awaited<ReturnType<typeof prisma.tableReservation.findMany<{
  include: {
    restaurant: { select: { id: true; name: true; city: true; imageUrl: true } };
  };
}>>>[number];

function ReservationRow({ reservation: r, showCancel }: { reservation: Reservation; showCancel: boolean }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
      {r.restaurant?.imageUrl ? (
        <img
          src={r.restaurant.imageUrl}
          alt={r.restaurant.name}
          className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
        />
      ) : (
        <span className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">🍽️</span>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900 truncate">
          {r.restaurant?.name ?? "Restaurant"}
        </p>
        <p className="text-xs text-gray-400 mt-0.5">
          {r.restaurant?.city}
          {` · ${r.date.toLocaleDateString("en-KE", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}`}
          {` at ${fmtTime(r.date)}`}
          {` · ${r.partySize} guest${r.partySize !== 1 ? "s" : ""}`}
        </p>
      </div>
      <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
        <StatusBadge status={r.status} />
        {showCancel && <CancelButton id={r.id} kind="reservation" />}
      </div>
    </div>
  );
}

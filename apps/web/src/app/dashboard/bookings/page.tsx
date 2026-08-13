import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { prisma } from "@/lib/prisma";
import { BookingStatus, ReservationStatus } from "@prisma/client";
import { CancelButton } from "../CancelButton";

const PAGE_SIZE = 15;

// ─── helpers ──────────────────────────────────────────────────────────────────

function fmtDate(date: Date, withYear = true) {
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    ...(withYear ? { year: "numeric" } : {}),
  });
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

// ─── unified row type ─────────────────────────────────────────────────────────

type Row = {
  id: string;
  kind: "booking" | "reservation";
  emoji: string;
  title: string;
  detail: string;
  imageUrl: string | null;
  status: BookingStatus | ReservationStatus;
  amount: string | null;
  createdAt: Date;
  ticketId: string | null;
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BookingHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "CUSTOMER") redirect("/dashboard");

  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? "1", 10) || 1);

  const userId = session.user.id;

  // Count first so we can compute the safe page before fetching rows.
  const [totalBookings, totalReservations] = await Promise.all([
    prisma.booking.count({ where: { userId } }),
    prisma.tableReservation.count({ where: { userId } }),
  ]);

  const total = totalBookings + totalReservations;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);

  // To correctly assemble page N of interleaved rows we need at most
  // N * PAGE_SIZE records from each table — far fewer than loading everything.
  const limit = safePage * PAGE_SIZE;

  const [bookings, reservations] = await Promise.all([
    prisma.booking.findMany({
      where: { userId },
      take: limit,
      include: {
        hotel: { select: { name: true, city: true, imageUrl: true } },
        room:  { select: { name: true } },
        event: { select: { title: true, startDate: true, city: true, imageUrl: true } },
        restaurant: { select: { name: true, city: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.tableReservation.findMany({
      where: { userId },
      take: limit,
      include: {
        restaurant: { select: { name: true, city: true, imageUrl: true } },
      },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const rows: Row[] = [
    ...bookings.map((b): Row => {
      if (b.type === "HOTEL") {
        return {
          id: b.id,
          kind: "booking",
          emoji: "🏨",
          title: b.hotel?.name ?? "Hotel",
          detail: [
            b.hotel?.city,
            b.room?.name,
            b.checkIn && b.checkOut
              ? `${fmtDate(b.checkIn, false)} – ${fmtDate(b.checkOut)}`
              : b.checkIn
              ? fmtDate(b.checkIn)
              : null,
          ].filter(Boolean).join(" · "),
          imageUrl: b.hotel?.imageUrl ?? null,
          status: b.status,
          amount: `${b.currency} ${Number(b.totalAmount).toLocaleString()}`,
          createdAt: b.createdAt,
          ticketId: null,
        };
      }
      if (b.type === "EVENT") {
        return {
          id: b.id,
          kind: "booking",
          emoji: "🎉",
          title: b.event?.title ?? "Event",
          detail: [
            b.event?.city,
            b.event?.startDate ? fmtDate(b.event.startDate) : null,
            `${b.quantity} ticket${b.quantity !== 1 ? "s" : ""}`,
          ].filter(Boolean).join(" · "),
          imageUrl: b.event?.imageUrl ?? null,
          status: b.status,
          amount: `${b.currency} ${Number(b.totalAmount).toLocaleString()}`,
          createdAt: b.createdAt,
          ticketId: b.status === "CONFIRMED" ? b.id : null,
        };
      }
      return {
        id: b.id,
        kind: "booking",
        emoji: "🍽️",
        title: b.restaurant?.name ?? "Restaurant",
        detail: [b.restaurant?.city].filter(Boolean).join(" · "),
        imageUrl: b.restaurant?.imageUrl ?? null,
        status: b.status,
        amount: `${b.currency} ${Number(b.totalAmount).toLocaleString()}`,
        createdAt: b.createdAt,
        ticketId: null,
      };
    }),
    ...reservations.map((r): Row => ({
      id: r.id,
      kind: "reservation",
      emoji: "🍽️",
      title: r.restaurant?.name ?? "Restaurant",
      detail: [
        r.restaurant?.city,
        `${fmtDate(r.date)} at ${fmtTime(r.date)}`,
        `${r.partySize} guest${r.partySize !== 1 ? "s" : ""}`,
      ].filter(Boolean).join(" · "),
      imageUrl: r.restaurant?.imageUrl ?? null,
      status: r.status,
      amount: null,
      createdAt: r.createdAt,
      ticketId: null,
    })),
  ].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

  const pageRows = rows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8">
          <Link href="/dashboard" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
            ← Back to dashboard
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">My Bookings</h1>
          <p className="text-gray-500 mt-1 text-sm">
            Your full booking history — including past and cancelled bookings.
            {total > 0 && <span className="text-gray-400"> ({total} total)</span>}
          </p>
        </div>

        {total === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-10 text-center">
            <p className="text-3xl mb-2">🗂️</p>
            <p className="text-sm text-gray-500">You have no bookings yet.</p>
            <div className="mt-3 flex justify-center gap-4 text-xs font-medium">
              <Link href="/events" className="text-orange-600 hover:underline">Browse events</Link>
              <Link href="/hotels" className="text-orange-600 hover:underline">Browse hotels</Link>
              <Link href="/restaurants" className="text-orange-600 hover:underline">Browse restaurants</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {pageRows.map((row) => (
                <div
                  key={`${row.kind}-${row.id}`}
                  className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4"
                >
                  {row.imageUrl ? (
                    <img
                      src={row.imageUrl}
                      alt={row.title}
                      className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-2xl flex-shrink-0">
                      {row.emoji}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{row.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5 truncate">{row.detail}</p>
                    <p className="text-[11px] text-gray-300 mt-0.5">
                      Booked {fmtDate(row.createdAt)}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <StatusBadge status={row.status} />
                    {row.amount && (
                      <p className="text-xs font-medium text-gray-700">{row.amount}</p>
                    )}
                    {row.ticketId && (
                      <Link href={`/tickets/${row.ticketId}`} className="text-xs font-medium text-orange-600 hover:underline">
                        View ticket 🎫
                      </Link>
                    )}
                    {(row.status === "PENDING" || row.status === "CONFIRMED") && (
                      <CancelButton id={row.id} kind={row.kind} />
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                {safePage > 1 ? (
                  <Link
                    href={`/dashboard/bookings?page=${safePage - 1}`}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    ← Previous
                  </Link>
                ) : (
                  <span />
                )}
                <span className="text-xs text-gray-400">
                  Page {safePage} of {totalPages}
                </span>
                {safePage < totalPages ? (
                  <Link
                    href={`/dashboard/bookings?page=${safePage + 1}`}
                    className="text-xs font-medium text-orange-600 hover:text-orange-700 bg-white border border-gray-200 rounded-lg px-3 py-1.5"
                  >
                    Next →
                  </Link>
                ) : (
                  <span />
                )}
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}

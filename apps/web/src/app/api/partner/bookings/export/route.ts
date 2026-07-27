import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";
import { BookingStatus, ReservationStatus } from "@prisma/client";

function csvEscape(value: string | number | null | undefined): string {
  const str = value == null ? "" : String(value);
  // Wrap in quotes if it contains a comma, double-quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

function fmtDate(date: Date | null | undefined): string {
  if (!date) return "";
  return date.toISOString().split("T")[0]; // YYYY-MM-DD
}

export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = req.nextUrl;
  const statusParam   = searchParams.get("status")   ?? undefined;
  const propertyParam = searchParams.get("property") ?? undefined;

  // ── Load partner ─────────────────────────────────────────────────────────────
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    include: {
      hotels:      { where: { published: true }, select: { id: true, name: true } },
      events:      { where: { published: true }, select: { id: true, title: true } },
      restaurants: { where: { published: true }, select: { id: true, name: true } },
    },
  });

  if (!partner) return NextResponse.json({ error: "Partner not found" }, { status: 404 });

  // ── Build filters ─────────────────────────────────────────────────────────────
  const validStatuses: BookingStatus[] = ["PENDING", "CONFIRMED", "CANCELLED", "COMPLETED"];
  const statusFilter =
    statusParam && validStatuses.includes(statusParam as BookingStatus)
      ? (statusParam as BookingStatus)
      : undefined;

  const hotelIds      = partner.hotels.map((h) => h.id);
  const eventIds      = partner.events.map((e) => e.id);
  const restaurantIds = partner.restaurants.map((r) => r.id);

  const selectedHotelIds      = propertyParam ? hotelIds.filter((id) => id === propertyParam)      : hotelIds;
  const selectedEventIds      = propertyParam ? eventIds.filter((id) => id === propertyParam)      : eventIds;
  const selectedRestaurantIds = propertyParam ? restaurantIds.filter((id) => id === propertyParam) : restaurantIds;

  const bookingOrFilter = [
    selectedHotelIds.length      ? { hotelId:      { in: selectedHotelIds }      } : undefined,
    selectedEventIds.length      ? { eventId:      { in: selectedEventIds }      } : undefined,
    selectedRestaurantIds.length ? { restaurantId: { in: selectedRestaurantIds } } : undefined,
  ].filter(Boolean) as object[];

  const noProperties = bookingOrFilter.length === 0;

  // ── Fetch data ────────────────────────────────────────────────────────────────
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
        selectedRestaurantIds.length
          ? prisma.tableReservation.findMany({
              where: {
                restaurantId: { in: selectedRestaurantIds },
                ...(statusFilter ? { status: statusFilter as unknown as ReservationStatus } : {}),
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

  // ── Build CSV ─────────────────────────────────────────────────────────────────
  const header = ["Booking ID", "Type", "Property", "Customer Name", "Customer Email", "Date(s)", "Amount", "Currency", "Status"];

  const rows: string[][] = [];

  for (const b of bookings) {
    const propName    = b.type === "HOTEL" ? b.hotel?.name : b.type === "EVENT" ? b.event?.title : b.restaurant?.name;
    const typeLabel   = b.type === "HOTEL" ? "Hotel" : b.type === "EVENT" ? "Event" : "Restaurant";
    const dateRange   = b.type === "HOTEL"
      ? `${fmtDate(b.checkIn)} to ${fmtDate(b.checkOut)}`
      : fmtDate(b.createdAt);

    rows.push([
      b.id,
      typeLabel,
      propName ?? "",
      b.user?.name  ?? "",
      b.user?.email ?? "",
      dateRange,
      String(Number(b.totalAmount)),
      b.currency,
      b.status,
    ]);
  }

  for (const r of reservations) {
    const dateStr = new Date(r.date).toISOString().split("T")[0];
    const timeStr = new Date(r.date).toTimeString().slice(0, 5);

    rows.push([
      r.id,
      "Table Reservation",
      r.restaurant?.name ?? "",
      r.user?.name  ?? "",
      r.user?.email ?? "",
      `${dateStr} ${timeStr} (${r.partySize} guest${r.partySize !== 1 ? "s" : ""})`,
      "",
      "",
      r.status,
    ]);
  }

  const csvLines = [
    header.map(csvEscape).join(","),
    ...rows.map((row) => row.map(csvEscape).join(",")),
  ];

  const csv = csvLines.join("\r\n");

  return new NextResponse(csv, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="bookings-export.csv"`,
    },
  });
}

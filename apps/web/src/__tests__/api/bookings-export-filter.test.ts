/**
 * Tests for /api/partner/bookings/export (route.ts)
 *
 * Confirms the CSV export honours the query params the Export button passes:
 *  - ?status=CONFIRMED → only CONFIRMED booking + reservation rows appear
 *  - ?property=<id>    → only rows for that property appear
 *  - combined status + property filters
 *  - an invalid status value is ignored (all rows exported) rather than erroring
 *
 * The Prisma mocks emulate real DB filtering: findMany applies the `where`
 * clause the route builds against in-memory fixtures, so the assertions check
 * the actual CSV body, not just the query arguments.
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

jest.mock("@prisma/client", () => ({
  BookingStatus: {},
  ReservationStatus: {},
  PrismaClient: jest.fn(),
}));

// ── Fixtures ──────────────────────────────────────────────────────────────────

const partnerFixture = {
  id: "partner-1",
  hotels: [
    { id: "hotel-1", name: "Sunset Hotel" },
    { id: "hotel-2", name: "Harbour Inn" },
  ],
  events: [{ id: "event-1", title: "Jazz Night" }],
  restaurants: [{ id: "rest-1", name: "Mama's Kitchen" }],
};

const bookingsFixture = [
  { id: "b1", type: "HOTEL", status: "CONFIRMED", hotelId: "hotel-1", eventId: null, restaurantId: null,
    checkIn: new Date("2026-08-01"), checkOut: new Date("2026-08-03"), createdAt: new Date("2026-07-20"),
    totalAmount: 100, currency: "KES", user: { name: "Alice", email: "alice@x.com" },
    hotel: { name: "Sunset Hotel" }, event: null, restaurant: null },
  { id: "b2", type: "HOTEL", status: "PENDING", hotelId: "hotel-1", eventId: null, restaurantId: null,
    checkIn: new Date("2026-08-05"), checkOut: new Date("2026-08-06"), createdAt: new Date("2026-07-21"),
    totalAmount: 200, currency: "KES", user: { name: "Bob", email: "bob@x.com" },
    hotel: { name: "Sunset Hotel" }, event: null, restaurant: null },
  { id: "b3", type: "HOTEL", status: "CONFIRMED", hotelId: "hotel-2", eventId: null, restaurantId: null,
    checkIn: new Date("2026-08-10"), checkOut: new Date("2026-08-12"), createdAt: new Date("2026-07-22"),
    totalAmount: 300, currency: "KES", user: { name: "Cara", email: "cara@x.com" },
    hotel: { name: "Harbour Inn" }, event: null, restaurant: null },
  { id: "b4", type: "EVENT", status: "CANCELLED", hotelId: null, eventId: "event-1", restaurantId: null,
    checkIn: null, checkOut: null, createdAt: new Date("2026-07-23"),
    totalAmount: 50, currency: "KES", user: { name: "Dan", email: "dan@x.com" },
    hotel: null, event: { title: "Jazz Night" }, restaurant: null },
  { id: "b5", type: "RESTAURANT", status: "CONFIRMED", hotelId: null, eventId: null, restaurantId: "rest-1",
    checkIn: null, checkOut: null, createdAt: new Date("2026-07-24"),
    totalAmount: 75, currency: "KES", user: { name: "Eve", email: "eve@x.com" },
    hotel: null, event: null, restaurant: { name: "Mama's Kitchen" } },
];

const reservationsFixture = [
  { id: "r1", restaurantId: "rest-1", status: "CONFIRMED", date: new Date("2026-08-15T19:00:00Z"),
    partySize: 2, user: { name: "Fay", email: "fay@x.com" }, restaurant: { name: "Mama's Kitchen" } },
  { id: "r2", restaurantId: "rest-1", status: "PENDING", date: new Date("2026-08-16T20:00:00Z"),
    partySize: 4, user: { name: "Gus", email: "gus@x.com" }, restaurant: { name: "Mama's Kitchen" } },
];

// ── Prisma mock that emulates DB-side filtering ──────────────────────────────

type Where = {
  status?: string;
  OR?: Array<Record<string, { in: string[] }>>;
  restaurantId?: { in: string[] };
};

function filterBookings(where: Where) {
  return bookingsFixture.filter((b) => {
    if (where.status && b.status !== where.status) return false;
    if (where.OR) {
      return where.OR.some((clause) =>
        Object.entries(clause).some(([field, cond]) =>
          cond.in.includes((b as Record<string, unknown>)[field] as string),
        ),
      );
    }
    return true;
  });
}

function filterReservations(where: Where) {
  return reservationsFixture.filter((r) => {
    if (where.status && r.status !== where.status) return false;
    if (where.restaurantId && !where.restaurantId.in.includes(r.restaurantId)) return false;
    return true;
  });
}

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner: {
      findUnique: jest.fn().mockImplementation(() => Promise.resolve(partnerFixture)),
    },
    booking: {
      findMany: jest.fn().mockImplementation(({ where }: { where: Where }) =>
        Promise.resolve(filterBookings(where)),
      ),
    },
    tableReservation: {
      findMany: jest.fn().mockImplementation(({ where }: { where: Where }) =>
        Promise.resolve(filterReservations(where)),
      ),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/partner/bookings/export/route";

const mockGetServerSession = getServerSession as unknown as jest.Mock;

async function exportCsv(query = ""): Promise<{ status: number; rows: string[][] }> {
  const req = new NextRequest(`http://localhost/api/partner/bookings/export${query}`);
  const res = await GET(req);
  const text = await res.text();
  const lines = text.split("\r\n").filter((l) => l.length > 0);
  // Naive CSV split is fine — fixture values contain no commas/quotes.
  return { status: res.status, rows: lines.slice(1).map((l) => l.split(",")) };
}

const STATUS_COL = 8; // last column in the bookings CSV
const PROPERTY_COL = 2;

beforeEach(() => {
  mockGetServerSession.mockResolvedValue({
    user: { id: "user-1", role: "PARTNER" },
  });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("bookings CSV export filters", () => {
  it("exports all bookings and reservations when no filters are set", async () => {
    const { status, rows } = await exportCsv();
    expect(status).toBe(200);
    expect(rows.map((r) => r[0]).sort()).toEqual(["b1", "b2", "b3", "b4", "b5", "r1", "r2"]);
  });

  it("returns only CONFIRMED rows when ?status=CONFIRMED", async () => {
    const { status, rows } = await exportCsv("?status=CONFIRMED");
    expect(status).toBe(200);
    expect(rows.length).toBeGreaterThan(0);
    for (const row of rows) expect(row[STATUS_COL]).toBe("CONFIRMED");
    expect(rows.map((r) => r[0]).sort()).toEqual(["b1", "b3", "b5", "r1"]);
  });

  it("returns only PENDING rows when ?status=PENDING", async () => {
    const { rows } = await exportCsv("?status=PENDING");
    for (const row of rows) expect(row[STATUS_COL]).toBe("PENDING");
    expect(rows.map((r) => r[0]).sort()).toEqual(["b2", "r2"]);
  });

  it("returns only rows for the selected property when ?property=<hotelId>", async () => {
    const { rows } = await exportCsv("?property=hotel-1");
    for (const row of rows) expect(row[PROPERTY_COL]).toBe("Sunset Hotel");
    expect(rows.map((r) => r[0]).sort()).toEqual(["b1", "b2"]);
  });

  it("combines status and property filters", async () => {
    const { rows } = await exportCsv("?status=CONFIRMED&property=hotel-1");
    expect(rows.map((r) => r[0])).toEqual(["b1"]);
    expect(rows[0][STATUS_COL]).toBe("CONFIRMED");
    expect(rows[0][PROPERTY_COL]).toBe("Sunset Hotel");
  });

  it("restaurant property filter includes its bookings and table reservations only", async () => {
    const { rows } = await exportCsv("?property=rest-1");
    for (const row of rows) expect(row[PROPERTY_COL]).toBe("Mama's Kitchen");
    expect(rows.map((r) => r[0]).sort()).toEqual(["b5", "r1", "r2"]);
  });

  it("ignores an invalid status value and exports all rows", async () => {
    const { status, rows } = await exportCsv("?status=NONSENSE");
    expect(status).toBe(200);
    expect(rows.map((r) => r[0]).sort()).toEqual(["b1", "b2", "b3", "b4", "b5", "r1", "r2"]);
  });

  it("reservation-only export honours the status filter", async () => {
    const { rows } = await exportCsv("?type=reservation&status=CONFIRMED");
    expect(rows.map((r) => r[0])).toEqual(["r1"]);
    for (const row of rows) expect(row[7]).toBe("CONFIRMED");
  });
});

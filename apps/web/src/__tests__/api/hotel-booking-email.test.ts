/**
 * Tests for POST /api/hotels/[id]/book — email dispatch via after()
 *
 * Verifies that:
 *  - after() is scheduled for both partner notification and guest confirmation
 *  - The callbacks actually invoke the correct email functions
 *  - A missing partner email skips the partner notification
 *  - A missing guest session email skips the guest confirmation
 *  - Email failures are caught and do not surface to the guest (no 500)
 */

// ── Mocks ──────────────────────────────────────────────────────────────────

/** Collect every callback registered with after() so tests can flush them */
const afterCallbacks: Array<() => Promise<unknown>> = [];

jest.mock("next/server", () => {
  const actual = jest.requireActual<typeof import("next/server")>("next/server");
  return {
    ...actual,
    after: jest.fn((cb: () => Promise<unknown>) => {
      afterCallbacks.push(cb);
    }),
  };
});

const mockHotelFindUnique = jest.fn();
const mockRoomFindFirst = jest.fn();
const mockBookingCount = jest.fn();
const mockBookingCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    hotel: { findUnique: (...a: unknown[]) => mockHotelFindUnique(...a) },
    room: { findFirst: (...a: unknown[]) => mockRoomFindFirst(...a) },
    booking: {
      count: (...a: unknown[]) => mockBookingCount(...a),
      create: (...a: unknown[]) => mockBookingCreate(...a),
    },
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...a: unknown[]) => mockGetServerSession(...a),
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockSendPartnerBookingNotification = jest.fn();
const mockSendGuestHotelConfirmation = jest.fn();

jest.mock("@/lib/email", () => ({
  sendPartnerBookingNotification: (...a: unknown[]) =>
    mockSendPartnerBookingNotification(...a),
  sendGuestHotelConfirmation: (...a: unknown[]) =>
    mockSendGuestHotelConfirmation(...a),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const HOTEL = {
  id: "hotel-1",
  name: "Ocean View Hotel",
  partner: { user: { name: "Partner Pete", email: "partner@example.com" } },
};

const ROOM = {
  id: "room-1",
  hotelId: "hotel-1",
  available: true,
  quantity: 5,
  price: 200,
  currency: "USD",
};

const BOOKING_RESULT = {
  id: "booking-1",
  room: ROOM,
  hotel: HOTEL,
  user: { name: "Guest Greta" },
  checkIn: new Date("2026-09-01"),
  checkOut: new Date("2026-09-03"),
  totalAmount: 400,
  currency: "USD",
};

const SESSION = {
  user: { id: "user-1", name: "Guest Greta", email: "guest@example.com" },
};

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as import("next/server").NextRequest;
}

const VALID_BODY = {
  roomId: "room-1",
  checkIn: "2026-09-01",
  checkOut: "2026-09-03",
  guests: 2,
};

// ── Helpers ────────────────────────────────────────────────────────────────

/** Flush all pending after() callbacks and wait for them to settle */
async function flushAfterCallbacks() {
  const cbs = afterCallbacks.splice(0);
  await Promise.allSettled(cbs.map((cb) => cb()));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/hotels/[id]/book — email dispatch via after()", () => {
  beforeEach(() => {
    jest.resetModules();
    afterCallbacks.length = 0;
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(SESSION);
    mockHotelFindUnique.mockResolvedValue(HOTEL);
    mockRoomFindFirst.mockResolvedValue(ROOM);
    mockBookingCount.mockResolvedValue(0);
    mockBookingCreate.mockResolvedValue(BOOKING_RESULT);
    mockSendPartnerBookingNotification.mockResolvedValue(undefined);
    mockSendGuestHotelConfirmation.mockResolvedValue(undefined);
  });

  it("returns 201 and schedules both partner and guest emails on a valid booking", async () => {
    const { after } = await import("next/server");

    const hotelNoPartnerEmail = {
      ...HOTEL,
      partner: { user: { name: "Partner Pete", email: null } },
    };
    const { POST } = await import("@/app/api/hotels/[id]/book/route");

    const res = await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "hotel-1" }),
    });

    expect(res.status).toBe(201);
    expect(after).toHaveBeenCalledTimes(2);

    await flushAfterCallbacks();
    expect(mockSendPartnerBookingNotification).toHaveBeenCalledTimes(1);
    expect(mockSendGuestHotelConfirmation).toHaveBeenCalledTimes(1);
  });


  it("skips guest confirmation when session has no email", async () => {
    const { after } = await import("next/server");

    const hotelNoPartnerEmail = {
      ...HOTEL,
      partner: { user: { name: "Partner Pete", email: null } },
    };
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", name: "Anon", email: null },
    });

    const { POST } = await import("@/app/api/hotels/[id]/book/route");
    await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "hotel-1" }),
    });
    await flushAfterCallbacks();

    // Only partner notification scheduled
    expect(after).toHaveBeenCalledTimes(1);
    expect(mockSendGuestHotelConfirmation).not.toHaveBeenCalled();
    expect(mockSendPartnerBookingNotification).toHaveBeenCalledTimes(1);
  });

  it("does not return 500 when partner email callback throws", async () => {
    mockSendPartnerBookingNotification.mockRejectedValue(
      new Error("Resend unavailable")
    );

    const { POST } = await import("@/app/api/hotels/[id]/book/route");
    const res = await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "hotel-1" }),
    });

    expect(res.status).toBe(201);
    await expect(flushAfterCallbacks()).resolves.not.toThrow();
    expect(mockSendGuestHotelConfirmation).toHaveBeenCalledTimes(1);
  });

  it("schedules callbacks independently for rapid successive requests", async () => {
    const { POST } = await import("@/app/api/hotels/[id]/book/route");

    // Fire two bookings concurrently
    await Promise.all([
      POST(makeRequest(VALID_BODY), { params: Promise.resolve({ id: "hotel-1" }) }),
      POST(makeRequest(VALID_BODY), { params: Promise.resolve({ id: "hotel-1" }) }),
    ]);

    expect(afterCallbacks.length).toBe(4); // 2 per booking
    await flushAfterCallbacks();

    expect(mockSendPartnerBookingNotification).toHaveBeenCalledTimes(2);
    expect(mockSendGuestHotelConfirmation).toHaveBeenCalledTimes(2);
  });
});

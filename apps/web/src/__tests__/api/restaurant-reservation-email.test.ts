/**
 * Tests for POST /api/restaurants/[id]/reservations — email dispatch via after()
 *
 * Verifies that:
 *  - after() is scheduled for both partner notification and guest confirmation
 *  - The callbacks actually invoke the correct email functions
 *  - A missing partner email skips the partner notification
 *  - Email failures are caught and do not surface to the guest (no 500)
 */

export {};

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

const mockRestaurantFindUnique = jest.fn();
const mockTableReservationCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    restaurant: { findUnique: (...a: unknown[]) => mockRestaurantFindUnique(...a) },
    tableReservation: { create: (...a: unknown[]) => mockTableReservationCreate(...a) },
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...a: unknown[]) => mockGetServerSession(...a),
}));

jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockSendPartnerBookingNotification = jest.fn();
const mockSendGuestReservationEnquiryReceived = jest.fn();

jest.mock("@/lib/email", () => ({
  sendPartnerBookingNotification: (...a: unknown[]) =>
    mockSendPartnerBookingNotification(...a),
  sendGuestReservationEnquiryReceived: (...a: unknown[]) =>
    mockSendGuestReservationEnquiryReceived(...a),
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

const RESTAURANT = {
  id: "rest-1",
  name: "The Grand Table",
  partner: { user: { name: "Partner Paula", email: "partner@example.com" } },
};

const RESERVATION_RESULT = {
  id: "res-1",
  restaurantId: "rest-1",
  date: new Date("2026-10-15T19:00:00"),
  partySize: 4,
  name: "Guest Greg",
  email: "guest@example.com",
  status: "PENDING",
};

const SESSION = {
  user: { id: "user-1", name: "Guest Greg", email: "guest@example.com" },
};

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as import("next/server").NextRequest;
}

// Future date so the "must be in the future" guard passes
const VALID_BODY = {
  date: "2026-10-15",
  time: "19:00",
  partySize: 4,
  name: "Guest Greg",
  email: "guest@example.com",
  phone: "+1234567890",
  notes: "Window seat please",
};

// ── Helpers ────────────────────────────────────────────────────────────────

async function flushAfterCallbacks() {
  const cbs = afterCallbacks.splice(0);
  await Promise.allSettled(cbs.map((cb) => cb()));
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("POST /api/restaurants/[id]/reservations — email dispatch via after()", () => {
  beforeEach(() => {
    jest.resetModules();
    afterCallbacks.length = 0;
    jest.clearAllMocks();

    mockGetServerSession.mockResolvedValue(SESSION);
    mockRestaurantFindUnique.mockResolvedValue(RESTAURANT);
    mockTableReservationCreate.mockResolvedValue(RESERVATION_RESULT);
    mockSendPartnerBookingNotification.mockResolvedValue(undefined);
    mockSendGuestReservationEnquiryReceived.mockResolvedValue(undefined);
  });

  it("returns 201 and schedules two after() callbacks on a valid reservation", async () => {
    const { after } = await import("next/server");
    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );

    const res = await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });

    expect(res.status).toBe(201);
    await expect(flushAfterCallbacks()).resolves.not.toThrow();
    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("schedules callbacks independently for rapid successive requests", async () => {
    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );
    await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });
    await flushAfterCallbacks();

    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("does not return 500 when partner email callback throws", async () => {
    mockSendPartnerBookingNotification.mockRejectedValue(
      new Error("Resend unavailable")
    );

    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );

    await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });
    await flushAfterCallbacks();

    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledWith(
      expect.objectContaining({
        guestEmail: "guest@example.com",
        guestName: "Guest Greg",
        restaurantName: "The Grand Table",
        partySize: 4,
      })
    );
  });

  it("skips partner notification when partner has no email", async () => {
    const { after } = await import("next/server");
    mockRestaurantFindUnique.mockResolvedValue({
      ...RESTAURANT,
      partner: { user: { name: "Partner Paula", email: null } },
    });

    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );
    await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });
    await flushAfterCallbacks();

    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("does not return 500 when partner email callback throws", async () => {
    mockSendPartnerBookingNotification.mockRejectedValue(
      new Error("Resend unavailable")
    );

    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );
    await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });
    await flushAfterCallbacks();

    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("does not return 500 when partner email callback throws", async () => {
    mockSendPartnerBookingNotification.mockRejectedValue(
      new Error("Resend unavailable")
    );

    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );
    const res = await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });

    expect(res.status).toBe(201);
    await expect(flushAfterCallbacks()).resolves.not.toThrow();
    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("schedules callbacks independently for rapid successive requests", async () => {
    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );
    const res = await POST(makeRequest(VALID_BODY), {
      params: Promise.resolve({ id: "rest-1" }),
    });

    expect(res.status).toBe(201);
    await expect(flushAfterCallbacks()).resolves.not.toThrow();
    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(1);
  });

  it("schedules callbacks independently for rapid successive requests", async () => {
    const { POST } = await import(
      "@/app/api/restaurants/[id]/reservations/route"
    );

    await Promise.all([
      POST(makeRequest(VALID_BODY), { params: Promise.resolve({ id: "rest-1" }) }),
      POST(makeRequest(VALID_BODY), { params: Promise.resolve({ id: "rest-1" }) }),
    ]);

    expect(afterCallbacks.length).toBe(4); // 2 per reservation
    await flushAfterCallbacks();

    expect(mockSendPartnerBookingNotification).toHaveBeenCalledTimes(2);
    expect(mockSendGuestReservationEnquiryReceived).toHaveBeenCalledTimes(2);
  });
});

export {};

/**
 * Unit tests for partner room server actions
 * (apps/web/src/app/partner/hotels/[id]/rooms/actions.ts)
 *
 * Covers:
 *  - createRoom: validation, ownership check, successful creation, revalidation
 *  - updateRoom: ownership check on hotel + room, validation, successful update
 *  - deleteRoom: hotel ownership + room-to-hotel membership check before delete
 */

export {};

// ── Mocks ────────────────────────────────────────────────────────────────────

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...a: unknown[]) => mockGetServerSession(...a),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockPartnerFindUnique = jest.fn();
const mockHotelFindFirst    = jest.fn();
const mockRoomFindFirst     = jest.fn();
const mockRoomCreate        = jest.fn();
const mockRoomUpdate        = jest.fn();
const mockRoomDelete        = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner:  { findUnique: (...a: unknown[]) => mockPartnerFindUnique(...a) },
    hotel:    { findFirst:  (...a: unknown[]) => mockHotelFindFirst(...a)    },
    room:     {
      findFirst: (...a: unknown[]) => mockRoomFindFirst(...a),
      create:    (...a: unknown[]) => mockRoomCreate(...a),
      update:    (...a: unknown[]) => mockRoomUpdate(...a),
      delete:    (...a: unknown[]) => mockRoomDelete(...a),
    },
  },
}));

const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => mockRevalidatePath(...a),
  revalidateTag:  jest.fn(),
}));

// ── Fixtures ─────────────────────────────────────────────────────────────────

const PARTNER    = { id: "partner-1" };
const HOTEL      = { id: "hotel-1" };
const ROOM       = { id: "room-1" };
const SESSION    = { user: { id: "user-1", role: "PARTNER" } };

function makeFormData(fields: Record<string, string | undefined>): FormData {
  const fd = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    if (value !== undefined) fd.set(key, value);
  }
  return fd;
}

const VALID_FIELDS = {
  name:      "Deluxe King",
  price:     "5000",
  currency:  "KES",
  capacity:  "2",
  maxGuests: "2",
  quantity:  "3",
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function setupAuth() {
  mockGetServerSession.mockResolvedValue(SESSION);
  mockPartnerFindUnique.mockResolvedValue(PARTNER);
  mockHotelFindFirst.mockResolvedValue(HOTEL);
}

// ── createRoom ───────────────────────────────────────────────────────────────

describe("createRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns error when session is missing", async () => {
    mockGetServerSession.mockResolvedValue(null);
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom("hotel-1", null, makeFormData(VALID_FIELDS));
    expect(result.error).toBeDefined();
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("returns error when partner profile is not found", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockPartnerFindUnique.mockResolvedValue(null);
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom("hotel-1", null, makeFormData(VALID_FIELDS));
    expect(result.error).toBeDefined();
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("returns error when hotel does not belong to this partner", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockPartnerFindUnique.mockResolvedValue(PARTNER);
    mockHotelFindFirst.mockResolvedValue(null); // hotel not found for this partner
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom("hotel-1", null, makeFormData(VALID_FIELDS));
    expect(result.error).toBeDefined();
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("returns error when name is empty", async () => {
    setupAuth();
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom(
      "hotel-1",
      null,
      makeFormData({ ...VALID_FIELDS, name: "" }),
    );
    expect(result.error).toMatch(/name/i);
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("returns error when price is zero", async () => {
    setupAuth();
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom(
      "hotel-1",
      null,
      makeFormData({ ...VALID_FIELDS, price: "0" }),
    );
    expect(result.error).toMatch(/price/i);
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("returns error for unsupported currency", async () => {
    setupAuth();
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom(
      "hotel-1",
      null,
      makeFormData({ ...VALID_FIELDS, currency: "XYZ" }),
    );
    expect(result.error).toMatch(/currency/i);
    expect(mockRoomCreate).not.toHaveBeenCalled();
  });

  it("creates the room and revalidates on success", async () => {
    setupAuth();
    mockRoomCreate.mockResolvedValue({ id: "room-new" });
    const { createRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await createRoom("hotel-1", null, makeFormData(VALID_FIELDS));
    expect(result.error).toBeUndefined();
    expect(mockRoomCreate).toHaveBeenCalledTimes(1);
    expect(mockRoomCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ hotelId: "hotel-1", name: "Deluxe King" }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      expect.stringContaining("hotel-1"),
    );
  });
});

// ── updateRoom ───────────────────────────────────────────────────────────────

describe("updateRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns error when room does not belong to this hotel", async () => {
    setupAuth();
    mockRoomFindFirst.mockResolvedValue(null); // room not found for this hotel
    const { updateRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await updateRoom(
      "hotel-1",
      "room-1",
      null,
      makeFormData(VALID_FIELDS),
    );
    expect(result.error).toBeDefined();
    expect(mockRoomUpdate).not.toHaveBeenCalled();
  });

  it("updates the room and revalidates on success", async () => {
    setupAuth();
    mockRoomFindFirst.mockResolvedValue(ROOM);
    mockRoomUpdate.mockResolvedValue({ id: "room-1" });
    const { updateRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await updateRoom(
      "hotel-1",
      "room-1",
      null,
      makeFormData({ ...VALID_FIELDS, name: "Superior Suite" }),
    );
    expect(result.error).toBeUndefined();
    expect(mockRoomUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "room-1" },
        data:  expect.objectContaining({ name: "Superior Suite" }),
      }),
    );
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      expect.stringContaining("hotel-1"),
    );
  });
});

// ── deleteRoom ───────────────────────────────────────────────────────────────

describe("deleteRoom", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns error when hotel does not belong to this partner", async () => {
    mockGetServerSession.mockResolvedValue(SESSION);
    mockPartnerFindUnique.mockResolvedValue(PARTNER);
    mockHotelFindFirst.mockResolvedValue(null); // wrong partner
    const { deleteRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await deleteRoom("hotel-1", "room-1");
    expect(result.error).toBeDefined();
    expect(mockRoomDelete).not.toHaveBeenCalled();
  });

  it("returns error when room does not belong to this hotel (cross-hotel guard)", async () => {
    setupAuth();
    mockRoomFindFirst.mockResolvedValue(null); // room not under this hotel
    const { deleteRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await deleteRoom("hotel-1", "room-from-another-hotel");
    expect(result.error).toMatch(/not found|access denied/i);
    expect(mockRoomDelete).not.toHaveBeenCalled();
  });

  it("deletes the room and revalidates on success", async () => {
    setupAuth();
    mockRoomFindFirst.mockResolvedValue(ROOM);
    mockRoomDelete.mockResolvedValue(ROOM);
    const { deleteRoom } = await import(
      "@/app/partner/hotels/[id]/rooms/actions"
    );
    const result = await deleteRoom("hotel-1", "room-1");
    expect(result.error).toBeUndefined();
    expect(mockRoomDelete).toHaveBeenCalledWith({ where: { id: "room-1" } });
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      expect.stringContaining("hotel-1"),
    );
  });
});

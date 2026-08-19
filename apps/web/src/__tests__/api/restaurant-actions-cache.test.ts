/**
 * Tests for partner restaurant actions cache invalidation
 * (apps/web/src/app/partner/restaurants/actions.ts)
 *
 * The public /restaurants page caches its data with
 * unstable_cache(..., { tags: ["restaurants-listing"] }), so every partner
 * mutation (create, update/publish/unpublish, delete) must call
 * revalidateTag("restaurants-listing") — otherwise the listing can stay
 * stale for up to 60 s. These tests fail if any action stops invalidating
 * the tag or the affected paths.
 */

export {};

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockRevalidateTag = jest.fn();
const mockRevalidatePath = jest.fn();

jest.mock("next/cache", () => ({
  revalidateTag: (...a: unknown[]) => mockRevalidateTag(...a),
  revalidatePath: (...a: unknown[]) => mockRevalidatePath(...a),
  unstable_cache: (fn: unknown) => fn,
}));

const REDIRECT = new Error("NEXT_REDIRECT");
jest.mock("next/navigation", () => ({
  redirect: jest.fn(() => {
    throw REDIRECT;
  }),
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...a: unknown[]) => mockGetServerSession(...a),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockPartnerFindUnique = jest.fn();
const mockRestaurantCreate = jest.fn();
const mockRestaurantUpdate = jest.fn();
const mockRestaurantDelete = jest.fn();
const mockRestaurantFindFirst = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner: { findUnique: (...a: unknown[]) => mockPartnerFindUnique(...a) },
    restaurant: {
      create: (...a: unknown[]) => mockRestaurantCreate(...a),
      update: (...a: unknown[]) => mockRestaurantUpdate(...a),
      delete: (...a: unknown[]) => mockRestaurantDelete(...a),
      findFirst: (...a: unknown[]) => mockRestaurantFindFirst(...a),
    },
  },
}));

// ── Fixtures ───────────────────────────────────────────────────────────────

function makeForm(published: boolean): FormData {
  const fd = new FormData();
  fd.set("name", "Testaurant");
  fd.set("city", "Test City");
  fd.set("location", "1 Test Street");
  if (published) fd.set("published", "on");
  return fd;
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("partner restaurant actions — restaurants-listing cache invalidation", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({
      user: { id: "user-1", role: "PARTNER" },
    });
    mockPartnerFindUnique.mockResolvedValue({ id: "partner-1" });
    mockRestaurantFindFirst.mockResolvedValue({ id: "resto-1" });
    mockRestaurantCreate.mockResolvedValue({ id: "resto-1" });
    mockRestaurantUpdate.mockResolvedValue({ id: "resto-1" });
    mockRestaurantDelete.mockResolvedValue({ id: "resto-1" });
  });

  it("createRestaurant (published) revalidates the listing tag and paths", async () => {
    const { createRestaurant } = await import(
      "@/app/partner/restaurants/actions"
    );

    await expect(createRestaurant(null, makeForm(true))).rejects.toBe(REDIRECT);

    expect(mockRestaurantCreate).toHaveBeenCalledTimes(1);
    expect(mockRevalidateTag).toHaveBeenCalledWith("restaurants-listing", { expire: 0 });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants");
  });

  it("updateRestaurant (unpublish) revalidates the listing tag and paths", async () => {
    const { updateRestaurant } = await import(
      "@/app/partner/restaurants/actions"
    );

    await expect(
      updateRestaurant("resto-1", null, makeForm(false))
    ).rejects.toBe(REDIRECT);

    expect(mockRestaurantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "resto-1" },
        data: expect.objectContaining({ published: false }),
      })
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("restaurants-listing", { expire: 0 });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants/resto-1");
  });

  it("updateRestaurant (publish) revalidates the listing tag", async () => {
    const { updateRestaurant } = await import(
      "@/app/partner/restaurants/actions"
    );

    await expect(
      updateRestaurant("resto-1", null, makeForm(true))
    ).rejects.toBe(REDIRECT);

    expect(mockRestaurantUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ published: true }),
      })
    );
    expect(mockRevalidateTag).toHaveBeenCalledWith("restaurants-listing", { expire: 0 });
  });

  it("deleteRestaurant revalidates the listing tag and paths", async () => {
    const { deleteRestaurant } = await import(
      "@/app/partner/restaurants/actions"
    );

    const res = await deleteRestaurant("resto-1");

    expect(res).toEqual({});
    expect(mockRestaurantDelete).toHaveBeenCalledWith({
      where: { id: "resto-1" },
    });
    expect(mockRevalidateTag).toHaveBeenCalledWith("restaurants-listing", { expire: 0 });
    expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants");
    expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants/resto-1");
  });

  it("does NOT revalidate when the mutation fails", async () => {
    mockRestaurantCreate.mockRejectedValueOnce(new Error("db down"));
    const { createRestaurant } = await import(
      "@/app/partner/restaurants/actions"
    );

    const res = await createRestaurant(null, makeForm(true));

    expect(res).toEqual({ error: "Failed to create restaurant" });
    expect(mockRevalidateTag).not.toHaveBeenCalled();
  });
});

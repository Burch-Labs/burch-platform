/**
 * Tests for partner menu-item server actions
 * (apps/web/src/app/partner/restaurants/[id]/menu/actions.ts)
 *
 * Covers:
 *  - Ownership: actions reject when the restaurant doesn't belong to the partner
 *  - Create: valid item is persisted; validation errors for missing fields,
 *    bad price, and disallowed image hosts
 *  - Update: rejects items that don't belong to the restaurant
 *  - Delete: removes owned items only
 *  - Revalidation: public restaurant page is revalidated after every mutation
 */

export {};

// ── Mocks ──────────────────────────────────────────────────────────────────

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...a: unknown[]) => mockGetServerSession(...a),
}));
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockPartnerFindUnique = jest.fn();
const mockRestaurantFindFirst = jest.fn();
const mockMenuItemFindFirst = jest.fn();
const mockMenuItemCreate = jest.fn();
const mockMenuItemUpdate = jest.fn();
const mockMenuItemDelete = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner: { findUnique: (...a: unknown[]) => mockPartnerFindUnique(...a) },
    restaurant: { findFirst: (...a: unknown[]) => mockRestaurantFindFirst(...a) },
    menuItem: {
      findFirst: (...a: unknown[]) => mockMenuItemFindFirst(...a),
      create: (...a: unknown[]) => mockMenuItemCreate(...a),
      update: (...a: unknown[]) => mockMenuItemUpdate(...a),
      delete: (...a: unknown[]) => mockMenuItemDelete(...a),
    },
  },
}));

const mockRevalidatePath = jest.fn();
jest.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => mockRevalidatePath(...a),
  revalidateTag: jest.fn(),
}));

// ── Helpers ────────────────────────────────────────────────────────────────

const PARTNER_SESSION = { user: { id: "user-1", role: "PARTNER" } };

function form(fields: Record<string, string | undefined>): FormData {
  const data = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) data.set(k, v);
  }
  return data;
}

const VALID_FIELDS = {
  name: "Nyama Choma Platter",
  category: "Mains",
  price: "1200",
};

function setupOwnedRestaurant() {
  mockGetServerSession.mockResolvedValue(PARTNER_SESSION);
  mockPartnerFindUnique.mockResolvedValue({ id: "partner-1" });
  mockRestaurantFindFirst.mockResolvedValue({ id: "resto-1" });
}

async function importActions() {
  return import("@/app/partner/restaurants/[id]/menu/actions");
}

// ── Tests ──────────────────────────────────────────────────────────────────

describe("menu item server actions", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  describe("authorization", () => {
    it("rejects create when the user is not a partner or admin", async () => {
      mockGetServerSession.mockResolvedValue({ user: { id: "u", role: "CUSTOMER" } });

      const { createMenuItem } = await importActions();
      const result = await createMenuItem("resto-1", null, form(VALID_FIELDS));

      expect(result.error).toBe("Forbidden");
      expect(mockMenuItemCreate).not.toHaveBeenCalled();
    });

    it("rejects create when the restaurant belongs to another partner", async () => {
      mockGetServerSession.mockResolvedValue(PARTNER_SESSION);
      mockPartnerFindUnique.mockResolvedValue({ id: "partner-1" });
      mockRestaurantFindFirst.mockResolvedValue(null); // not owned

      const { createMenuItem } = await importActions();
      const result = await createMenuItem("someone-elses", null, form(VALID_FIELDS));

      expect(result.error).toBe("Restaurant not found or access denied");
      expect(mockMenuItemCreate).not.toHaveBeenCalled();
      // Ownership check must scope by partnerId
      expect(mockRestaurantFindFirst).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: "someone-elses", partnerId: "partner-1" },
        })
      );
    });

    it("rejects delete of a menu item that belongs to a different restaurant", async () => {
      setupOwnedRestaurant();
      mockMenuItemFindFirst.mockResolvedValue(null); // item not under this restaurant

      const { deleteMenuItem } = await importActions();
      const result = await deleteMenuItem("resto-1", "foreign-item");

      expect(result.error).toBe("Menu item not found");
      expect(mockMenuItemDelete).not.toHaveBeenCalled();
    });
  });

  describe("createMenuItem", () => {
    beforeEach(setupOwnedRestaurant);

    it("creates a valid item and revalidates the public restaurant page", async () => {
      mockMenuItemCreate.mockResolvedValue({ id: "item-1" });

      const { createMenuItem } = await importActions();
      const result = await createMenuItem(
        "resto-1",
        null,
        form({ ...VALID_FIELDS, description: "Char-grilled", available: "on" })
      );

      expect(result).toEqual({ success: true });
      expect(mockMenuItemCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          restaurantId: "resto-1",
          name: "Nyama Choma Platter",
          category: "Mains",
          price: "1200.00",
          available: true,
        }),
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants/resto-1");
    });

    it("rejects a missing name", async () => {
      const { createMenuItem } = await importActions();
      const result = await createMenuItem(
        "resto-1",
        null,
        form({ ...VALID_FIELDS, name: "  " })
      );
      expect(result.error).toBe("Item name is required");
      expect(mockMenuItemCreate).not.toHaveBeenCalled();
    });

    it("rejects a negative or non-numeric price", async () => {
      const { createMenuItem } = await importActions();

      const neg = await createMenuItem("resto-1", null, form({ ...VALID_FIELDS, price: "-5" }));
      expect(neg.error).toBe("Price must be a number of 0 or more");

      const nan = await createMenuItem("resto-1", null, form({ ...VALID_FIELDS, price: "abc" }));
      expect(nan.error).toBe("Price must be a number of 0 or more");

      expect(mockMenuItemCreate).not.toHaveBeenCalled();
    });

    it("rejects image URLs from hosts not in the Next image allowlist", async () => {
      const { createMenuItem } = await importActions();
      const result = await createMenuItem(
        "resto-1",
        null,
        form({ ...VALID_FIELDS, imageUrl: "https://evil.example.com/pic.jpg" })
      );
      expect(result.error).toMatch(/supported host/);
      expect(mockMenuItemCreate).not.toHaveBeenCalled();
    });

    it("accepts an image URL from an allowed host", async () => {
      mockMenuItemCreate.mockResolvedValue({ id: "item-1" });

      const { createMenuItem } = await importActions();
      const result = await createMenuItem(
        "resto-1",
        null,
        form({ ...VALID_FIELDS, imageUrl: "https://images.unsplash.com/photo-1" })
      );
      expect(result).toEqual({ success: true });
      expect(mockMenuItemCreate).toHaveBeenCalledWith({
        data: expect.objectContaining({
          imageUrl: "https://images.unsplash.com/photo-1",
        }),
      });
    });
  });

  describe("updateMenuItem", () => {
    beforeEach(setupOwnedRestaurant);

    it("updates an owned item and revalidates the public page", async () => {
      mockMenuItemFindFirst.mockResolvedValue({ id: "item-1" });
      mockMenuItemUpdate.mockResolvedValue({ id: "item-1" });

      const { updateMenuItem } = await importActions();
      const result = await updateMenuItem(
        "resto-1",
        "item-1",
        null,
        form({ ...VALID_FIELDS, price: "950.5" })
      );

      expect(result).toEqual({ success: true });
      expect(mockMenuItemUpdate).toHaveBeenCalledWith({
        where: { id: "item-1" },
        data: expect.objectContaining({ price: "950.50", available: false }),
      });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants/resto-1");
    });

    it("rejects an item that is not under the given restaurant", async () => {
      mockMenuItemFindFirst.mockResolvedValue(null);

      const { updateMenuItem } = await importActions();
      const result = await updateMenuItem("resto-1", "foreign", null, form(VALID_FIELDS));

      expect(result.error).toBe("Menu item not found");
      expect(mockMenuItemUpdate).not.toHaveBeenCalled();
    });
  });

  describe("deleteMenuItem", () => {
    beforeEach(setupOwnedRestaurant);

    it("deletes an owned item and revalidates the public page", async () => {
      mockMenuItemFindFirst.mockResolvedValue({ id: "item-1" });
      mockMenuItemDelete.mockResolvedValue({ id: "item-1" });

      const { deleteMenuItem } = await importActions();
      const result = await deleteMenuItem("resto-1", "item-1");

      expect(result).toEqual({});
      expect(mockMenuItemDelete).toHaveBeenCalledWith({ where: { id: "item-1" } });
      expect(mockRevalidatePath).toHaveBeenCalledWith("/restaurants/resto-1");
    });
  });
});

"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/roles";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requireOwnedRestaurant(restaurantId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && !isAdminRole(session.user.role))) {
    throw new Error("Forbidden");
  }
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) throw new Error("Partner profile not found");

  const restaurant = await prisma.restaurant.findFirst({
    where: { id: restaurantId, partnerId: partner.id },
    select: { id: true },
  });
  if (!restaurant) throw new Error("Restaurant not found or access denied");
  return restaurant;
}

/**
 * Hosts allowed by next.config images.remotePatterns — an image URL outside
 * this list would crash the public menu's <Image> rendering at runtime.
 */
const ALLOWED_IMAGE_HOSTS = [
  "images.unsplash.com",
  "plus.unsplash.com",
  "lh3.googleusercontent.com",
];

function validateImageUrl(raw: string): { url: string | null; error?: string } {
  if (!raw) return { url: null };
  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { url: null, error: "Image URL is not a valid URL" };
  }
  if (parsed.protocol !== "https:" || !ALLOWED_IMAGE_HOSTS.includes(parsed.hostname)) {
    return {
      url: null,
      error: `Image URL must be an https link from a supported host (${ALLOWED_IMAGE_HOSTS.join(", ")})`,
    };
  }
  return { url: raw };
}

function parseMenuItemForm(data: FormData): {
  fields?: {
    name: string;
    description: string | null;
    price: string;
    category: string;
    imageUrl: string | null;
    available: boolean;
    sortOrder: number;
  };
  error?: string;
} {
  const name = ((data.get("name") as string | null) ?? "").trim();
  const category = ((data.get("category") as string | null) ?? "").trim();
  const priceRaw = ((data.get("price") as string | null) ?? "").trim();
  const sortOrderRaw = ((data.get("sortOrder") as string | null) ?? "").trim();

  if (!name) return { error: "Item name is required" };
  if (!category) return { error: "Category is required" };

  const price = Number(priceRaw);
  if (priceRaw === "" || !Number.isFinite(price) || price < 0) {
    return { error: "Price must be a number of 0 or more" };
  }

  const sortOrder = sortOrderRaw === "" ? 0 : parseInt(sortOrderRaw, 10);
  if (!Number.isFinite(sortOrder)) return { error: "Sort order must be a number" };

  const imageRaw = ((data.get("imageUrl") as string | null) ?? "").trim();
  const { url: imageUrl, error: imageError } = validateImageUrl(imageRaw);
  if (imageError) return { error: imageError };

  return {
    fields: {
      name,
      description: ((data.get("description") as string | null) ?? "").trim() || null,
      price: price.toFixed(2),
      category,
      imageUrl,
      available: data.has("available"),
      sortOrder,
    },
  };
}

function revalidateMenu(restaurantId: string) {
  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath(`/partner/restaurants/${restaurantId}/menu`);
  revalidatePath("/partner/restaurants");
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createMenuItem(
  restaurantId: string,
  _prev: { error?: string; success?: boolean } | null,
  data: FormData,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireOwnedRestaurant(restaurantId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const { fields, error } = parseMenuItemForm(data);
  if (error || !fields) return { error };

  try {
    await prisma.menuItem.create({ data: { ...fields, restaurantId } });
  } catch (err) {
    console.error("[createMenuItem]", err);
    return { error: "Failed to add menu item" };
  }

  revalidateMenu(restaurantId);
  return { success: true };
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateMenuItem(
  restaurantId: string,
  menuItemId: string,
  _prev: { error?: string; success?: boolean } | null,
  data: FormData,
): Promise<{ error?: string; success?: boolean }> {
  try {
    await requireOwnedRestaurant(restaurantId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
    select: { id: true },
  });
  if (!existing) return { error: "Menu item not found" };

  const { fields, error } = parseMenuItemForm(data);
  if (error || !fields) return { error };

  try {
    await prisma.menuItem.update({ where: { id: menuItemId }, data: fields });
  } catch (err) {
    console.error("[updateMenuItem]", err);
    return { error: "Failed to update menu item" };
  }

  revalidateMenu(restaurantId);
  return { success: true };
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteMenuItem(
  restaurantId: string,
  menuItemId: string,
): Promise<{ error?: string }> {
  try {
    await requireOwnedRestaurant(restaurantId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.menuItem.findFirst({
    where: { id: menuItemId, restaurantId },
    select: { id: true },
  });
  if (!existing) return { error: "Menu item not found" };

  try {
    await prisma.menuItem.delete({ where: { id: menuItemId } });
  } catch (err) {
    console.error("[deleteMenuItem]", err);
    return { error: "Failed to delete menu item" };
  }

  revalidateMenu(restaurantId);
  return {};
}

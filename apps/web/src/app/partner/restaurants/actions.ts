"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { redirect } from "next/navigation";
import { isAdminRole } from "@/lib/roles";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requirePartner() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && !isAdminRole(session.user.role))) {
    throw new Error("Forbidden");
  }
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) throw new Error("Partner profile not found");
  return partner;
}

function parseFormData(data: FormData) {
  const priceRangeRaw = data.get("priceRange") as string | null;
  return {
    name:        (data.get("name") as string).trim(),
    description: (data.get("description") as string | null)?.trim() ?? null,
    imageUrl:    (data.get("imageUrl") as string | null)?.trim() || null,
    city:        (data.get("city") as string).trim(),
    location:    (data.get("location") as string).trim(),
    cuisine:     (data.get("cuisine") as string | null)?.trim() || null,
    priceRange:  priceRangeRaw ? parseInt(priceRangeRaw, 10) : null,
    phone:       (data.get("phone") as string | null)?.trim() || null,
    email:       (data.get("email") as string | null)?.trim() || null,
    website:     (data.get("website") as string | null)?.trim() || null,
    amenities:   ((data.get("amenities") as string | null) ?? "")
                   .split(",")
                   .map((a) => a.trim())
                   .filter(Boolean),
    published:   data.has("published"),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRestaurant(
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const fields = parseFormData(data);
  if (!fields.name)     return { error: "Restaurant name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.restaurant.create({
      data: { ...fields, partnerId: partner.id },
    });
  } catch (err) {
    console.error("[createRestaurant]", err);
    return { error: "Failed to create restaurant" };
  }

  // Bust the restaurants listing cache so the new restaurant appears immediately
  revalidateTag("restaurants-listing");
  revalidatePath("/restaurants");
  revalidatePath("/partner/restaurants");

  redirect("/partner/restaurants");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateRestaurant(
  restaurantId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.restaurant.findFirst({
    where: { id: restaurantId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Restaurant not found or access denied" };

  const fields = parseFormData(data);
  if (!fields.name)     return { error: "Restaurant name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.restaurant.update({
      where: { id: restaurantId },
      data:  fields,
    });
  } catch (err) {
    console.error("[updateRestaurant]", err);
    return { error: "Failed to update restaurant" };
  }

  // Bust the restaurants listing cache whenever a restaurant changes
  revalidateTag("restaurants-listing");
  revalidatePath("/restaurants");
  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/partner/restaurants");

  redirect("/partner/restaurants");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteRestaurant(restaurantId: string): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.restaurant.findFirst({
    where: { id: restaurantId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Restaurant not found or access denied" };

  try {
    await prisma.restaurant.delete({ where: { id: restaurantId } });
  } catch (err) {
    console.error("[deleteRestaurant]", err);
    return { error: "Failed to delete restaurant" };
  }

  revalidateTag("restaurants-listing");
  revalidatePath("/restaurants");
  revalidatePath(`/restaurants/${restaurantId}`);
  revalidatePath("/partner/restaurants");

  return {};
}

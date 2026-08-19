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
  const starRatingRaw = data.get("starRating") as string | null;
  return {
    name:         (data.get("name") as string).trim(),
    description:  (data.get("description") as string | null)?.trim() ?? null,
    imageUrl:     (data.get("imageUrl") as string | null)?.trim() || null,
    city:         (data.get("city") as string).trim(),
    location:     (data.get("location") as string).trim(),
    starRating:   starRatingRaw ? parseInt(starRatingRaw, 10) : null,
    amenities:    ((data.get("amenities") as string | null) ?? "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
    phone:        (data.get("phone") as string | null)?.trim() || null,
    email:        (data.get("email") as string | null)?.trim() || null,
    checkInTime:  (data.get("checkInTime") as string | null)?.trim() || "14:00",
    checkOutTime: (data.get("checkOutTime") as string | null)?.trim() || "11:00",
    published:    data.has("published"),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createHotel(
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
  if (!fields.name)     return { error: "Hotel name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.hotel.create({
      data: { ...fields, partnerId: partner.id },
    });
  } catch (err) {
    console.error("[createHotel]", err);
    return { error: "Failed to create hotel" };
  }

  // Bust the hotels listing cache so the new hotel appears immediately
  revalidateTag("hotels-listing", { expire: 0 });
  revalidatePath("/hotels");
  revalidatePath("/partner/hotels");

  redirect("/partner/hotels");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateHotel(
  hotelId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.hotel.findFirst({
    where: { id: hotelId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Hotel not found or access denied" };

  const fields = parseFormData(data);
  if (!fields.name)     return { error: "Hotel name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.hotel.update({
      where: { id: hotelId },
      data:  fields,
    });
  } catch (err) {
    console.error("[updateHotel]", err);
    return { error: "Failed to update hotel" };
  }

  // Bust the hotels listing cache whenever a hotel changes
  revalidateTag("hotels-listing", { expire: 0 });
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  revalidatePath("/partner/hotels");

  redirect("/partner/hotels");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteHotel(hotelId: string): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.hotel.findFirst({
    where: { id: hotelId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Hotel not found or access denied" };

  try {
    await prisma.hotel.delete({ where: { id: hotelId } });
  } catch (err) {
    console.error("[deleteHotel]", err);
    return { error: "Failed to delete hotel" };
  }

  revalidateTag("hotels-listing", { expire: 0 });
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  revalidatePath("/partner/hotels");

  return {};
}

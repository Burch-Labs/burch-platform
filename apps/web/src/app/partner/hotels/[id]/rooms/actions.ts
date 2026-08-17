"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/roles";

// ─── helpers ──────────────────────────────────────────────────────────────────

async function requirePartnerHotel(hotelId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && !isAdminRole(session.user.role))) {
    throw new Error("Forbidden");
  }
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) throw new Error("Partner profile not found");

  const hotel = await prisma.hotel.findFirst({
    where: { id: hotelId, partnerId: partner.id },
    select: { id: true },
  });
  if (!hotel) throw new Error("Hotel not found or access denied");

  return { partner, hotel };
}

const ALLOWED_CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "ZAR"];

function parseRoomFormData(data: FormData) {
  const priceRaw    = (data.get("price")     as string | null)?.trim() ?? "0";
  const capacityRaw = (data.get("capacity")  as string | null)?.trim() ?? "1";
  const maxGuestsRaw = (data.get("maxGuests") as string | null)?.trim() ?? "2";
  const quantityRaw  = (data.get("quantity") as string | null)?.trim() ?? "1";
  const currencyRaw  = (data.get("currency") as string | null)?.trim() ?? "KES";

  return {
    name:        (data.get("name") as string).trim(),
    description: (data.get("description") as string | null)?.trim() || null,
    imageUrl:    (data.get("imageUrl") as string | null)?.trim() || null,
    price:       parseFloat(priceRaw),
    currency:    currencyRaw,
    capacity:    Math.max(1, parseInt(capacityRaw, 10) || 1),
    maxGuests:   Math.max(1, parseInt(maxGuestsRaw, 10) || 1),
    bedType:     (data.get("bedType") as string | null)?.trim() || null,
    amenities:   ((data.get("amenities") as string | null) ?? "")
                   .split(",")
                   .map((a) => a.trim())
                   .filter(Boolean),
    quantity:    Math.max(1, parseInt(quantityRaw, 10) || 1),
    available:   data.has("available"),
  };
}

function validateRoomFields(fields: ReturnType<typeof parseRoomFormData>): string | null {
  if (!fields.name)          return "Room name is required";
  if (!isFinite(fields.price) || fields.price <= 0) return "Price must be a positive number";
  if (!ALLOWED_CURRENCIES.includes(fields.currency)) return `Currency must be one of: ${ALLOWED_CURRENCIES.join(", ")}`;
  if (fields.capacity < 1)   return "Capacity must be at least 1";
  if (fields.maxGuests < 1)  return "Max guests must be at least 1";
  if (fields.quantity < 1)   return "Quantity must be at least 1";
  return null;
}

function revalidateHotel(hotelId: string) {
  revalidatePath(`/partner/hotels/${hotelId}/rooms`);
  revalidatePath(`/partner/hotels/${hotelId}/edit`);
  revalidatePath(`/hotels/${hotelId}`);
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createRoom(
  hotelId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const fields = parseRoomFormData(data);
  const validationError = validateRoomFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.room.create({
      data: { ...fields, hotelId },
    });
  } catch (err) {
    console.error("[createRoom]", err);
    return { error: "Failed to create room" };
  }

  revalidateHotel(hotelId);
  return {};
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateRoom(
  hotelId: string,
  roomId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
    select: { id: true },
  });
  if (!existing) return { error: "Room not found" };

  const fields = parseRoomFormData(data);
  const validationError = validateRoomFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.room.update({
      where: { id: roomId },
      data:  fields,
    });
  } catch (err) {
    console.error("[updateRoom]", err);
    return { error: "Failed to update room" };
  }

  revalidateHotel(hotelId);
  return {};
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteRoom(
  hotelId: string,
  roomId: string,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  // Confirm the room belongs to this hotel before deleting
  const room = await prisma.room.findFirst({
    where: { id: roomId, hotelId },
    select: { id: true },
  });
  if (!room) return { error: "Room not found or access denied" };

  try {
    await prisma.room.delete({ where: { id: roomId } });
  } catch (err) {
    console.error("[deleteRoom]", err);
    return { error: "Failed to delete room" };
  }

  revalidateHotel(hotelId);
  return {};
}

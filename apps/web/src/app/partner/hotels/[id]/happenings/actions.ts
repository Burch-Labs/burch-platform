"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRole } from "@/lib/roles";

/** Same shape as the max the admin-side tool imposes indirectly via review,
 * made explicit here since a partner isn't otherwise gated on volume. */
const MAX_HAPPENINGS_PER_HOTEL = 10;

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

function parseHappeningFormData(data: FormData) {
  const startsAtRaw = (data.get("startsAt") as string | null)?.trim() ?? "";
  const endsAtRaw = (data.get("endsAt") as string | null)?.trim() ?? "";

  return {
    title: (data.get("title") as string).trim(),
    description: (data.get("description") as string | null)?.trim() || null,
    flyerUrl: (data.get("flyerUrl") as string | null)?.trim() || null,
    startsAt: startsAtRaw ? new Date(startsAtRaw) : null,
    endsAt: endsAtRaw ? new Date(endsAtRaw) : null,
    published: data.has("published"),
  };
}

function validateHappeningFields(fields: ReturnType<typeof parseHappeningFormData>): string | null {
  if (!fields.title) return "Title is required";
  if (fields.startsAt && isNaN(fields.startsAt.getTime())) return "Start date is invalid";
  if (fields.endsAt && isNaN(fields.endsAt.getTime())) return "End date is invalid";
  if (fields.startsAt && fields.endsAt && fields.endsAt < fields.startsAt) {
    return "End date can't be before the start date";
  }
  return null;
}

function revalidateHotel(hotelId: string) {
  revalidatePath(`/partner/hotels/${hotelId}/happenings`);
  revalidatePath(`/hotels/${hotelId}`);
  revalidateTag("hotels-listing", { expire: 0 });
  revalidatePath("/");
}

export async function createHappening(
  hotelId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existingCount = await prisma.hotelHappening.count({ where: { hotelId } });
  if (existingCount >= MAX_HAPPENINGS_PER_HOTEL) {
    return { error: `You can have at most ${MAX_HAPPENINGS_PER_HOTEL} happenings at a time — delete one before adding another.` };
  }

  const fields = parseHappeningFormData(data);
  const validationError = validateHappeningFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.hotelHappening.create({
      data: { ...fields, hotelId },
    });
  } catch (err) {
    console.error("[createHappening/partner]", err);
    return { error: "Failed to create happening" };
  }

  revalidateHotel(hotelId);
  return {};
}

export async function updateHappening(
  hotelId: string,
  happeningId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.hotelHappening.findFirst({
    where: { id: happeningId, hotelId },
    select: { id: true },
  });
  if (!existing) return { error: "Happening not found" };

  const fields = parseHappeningFormData(data);
  const validationError = validateHappeningFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.hotelHappening.update({
      where: { id: happeningId },
      data: fields,
    });
  } catch (err) {
    console.error("[updateHappening/partner]", err);
    return { error: "Failed to update happening" };
  }

  revalidateHotel(hotelId);
  return {};
}

export async function deleteHappening(
  hotelId: string,
  happeningId: string,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const happening = await prisma.hotelHappening.findFirst({
    where: { id: happeningId, hotelId },
    select: { id: true },
  });
  if (!happening) return { error: "Happening not found" };

  try {
    await prisma.hotelHappening.delete({ where: { id: happeningId } });
  } catch (err) {
    console.error("[deleteHappening/partner]", err);
    return { error: "Failed to delete happening" };
  }

  revalidateHotel(hotelId);
  return {};
}

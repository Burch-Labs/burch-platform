"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRole } from "@/lib/roles";

/** Same cap as Happenings — an in-house spa doesn't need more than a
 * handful of live offers at once. */
const MAX_SPA_OFFERS_PER_HOTEL = 10;

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

function parseSpaOfferFormData(data: FormData) {
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

function validateSpaOfferFields(fields: ReturnType<typeof parseSpaOfferFormData>): string | null {
  if (!fields.title) return "Title is required";
  if (fields.startsAt && isNaN(fields.startsAt.getTime())) return "Start date is invalid";
  if (fields.endsAt && isNaN(fields.endsAt.getTime())) return "End date is invalid";
  if (fields.startsAt && fields.endsAt && fields.endsAt < fields.startsAt) {
    return "End date can't be before the start date";
  }
  return null;
}

function revalidateHotel(hotelId: string) {
  revalidatePath(`/partner/hotels/${hotelId}/spa`);
  revalidatePath(`/hotels/${hotelId}`);
  revalidateTag("hotels-listing", { expire: 0 });
  revalidatePath("/");
}

export async function createSpaOffer(
  hotelId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existingCount = await prisma.hotelSpaOffer.count({ where: { hotelId } });
  if (existingCount >= MAX_SPA_OFFERS_PER_HOTEL) {
    return { error: `You can have at most ${MAX_SPA_OFFERS_PER_HOTEL} spa offers at a time — delete one before adding another.` };
  }

  const fields = parseSpaOfferFormData(data);
  const validationError = validateSpaOfferFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.hotelSpaOffer.create({
      data: { ...fields, hotelId },
    });
  } catch (err) {
    console.error("[createSpaOffer/partner]", err);
    return { error: "Failed to create spa offer" };
  }

  revalidateHotel(hotelId);
  return {};
}

export async function updateSpaOffer(
  hotelId: string,
  offerId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.hotelSpaOffer.findFirst({
    where: { id: offerId, hotelId },
    select: { id: true },
  });
  if (!existing) return { error: "Spa offer not found" };

  const fields = parseSpaOfferFormData(data);
  const validationError = validateSpaOfferFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.hotelSpaOffer.update({
      where: { id: offerId },
      data: fields,
    });
  } catch (err) {
    console.error("[updateSpaOffer/partner]", err);
    return { error: "Failed to update spa offer" };
  }

  revalidateHotel(hotelId);
  return {};
}

export async function deleteSpaOffer(
  hotelId: string,
  offerId: string,
): Promise<{ error?: string }> {
  try {
    await requirePartnerHotel(hotelId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const offer = await prisma.hotelSpaOffer.findFirst({
    where: { id: offerId, hotelId },
    select: { id: true },
  });
  if (!offer) return { error: "Spa offer not found" };

  try {
    await prisma.hotelSpaOffer.delete({ where: { id: offerId } });
  } catch (err) {
    console.error("[deleteSpaOffer/partner]", err);
    return { error: "Failed to delete spa offer" };
  }

  revalidateHotel(hotelId);
  return {};
}

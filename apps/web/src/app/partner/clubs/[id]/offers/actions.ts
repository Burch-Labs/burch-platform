"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRole } from "@/lib/roles";

const MAX_OFFERS_PER_CLUB = 10;

async function requirePartnerClub(clubId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && !isAdminRole(session.user.role))) {
    throw new Error("Forbidden");
  }
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) throw new Error("Partner profile not found");

  const club = await prisma.club.findFirst({
    where: { id: clubId, partnerId: partner.id },
    select: { id: true },
  });
  if (!club) throw new Error("Club not found or access denied");

  return { partner, club };
}

function parseOfferFormData(data: FormData) {
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

function validateOfferFields(fields: ReturnType<typeof parseOfferFormData>): string | null {
  if (!fields.title) return "Title is required";
  if (fields.startsAt && isNaN(fields.startsAt.getTime())) return "Start date is invalid";
  if (fields.endsAt && isNaN(fields.endsAt.getTime())) return "End date is invalid";
  if (fields.startsAt && fields.endsAt && fields.endsAt < fields.startsAt) {
    return "End date can't be before the start date";
  }
  return null;
}

function revalidateClub(clubId: string) {
  revalidatePath(`/partner/clubs/${clubId}/offers`);
  revalidatePath(`/clubs/${clubId}`);
  revalidateTag("clubs-listing", { expire: 0 });
  revalidatePath("/clubs");
}

export async function createOffer(
  clubId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerClub(clubId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existingCount = await prisma.clubHappening.count({ where: { clubId } });
  if (existingCount >= MAX_OFFERS_PER_CLUB) {
    return { error: `You can have at most ${MAX_OFFERS_PER_CLUB} offers at a time — delete one before adding another.` };
  }

  const fields = parseOfferFormData(data);
  const validationError = validateOfferFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.clubHappening.create({
      data: { ...fields, clubId },
    });
  } catch (err) {
    console.error("[createOffer/partner]", err);
    return { error: "Failed to create offer" };
  }

  revalidateClub(clubId);
  return {};
}

export async function updateOffer(
  clubId: string,
  offerId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerClub(clubId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.clubHappening.findFirst({
    where: { id: offerId, clubId },
    select: { id: true },
  });
  if (!existing) return { error: "Offer not found" };

  const fields = parseOfferFormData(data);
  const validationError = validateOfferFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.clubHappening.update({
      where: { id: offerId },
      data: fields,
    });
  } catch (err) {
    console.error("[updateOffer/partner]", err);
    return { error: "Failed to update offer" };
  }

  revalidateClub(clubId);
  return {};
}

export async function deleteOffer(
  clubId: string,
  offerId: string,
): Promise<{ error?: string }> {
  try {
    await requirePartnerClub(clubId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const offer = await prisma.clubHappening.findFirst({
    where: { id: offerId, clubId },
    select: { id: true },
  });
  if (!offer) return { error: "Offer not found" };

  try {
    await prisma.clubHappening.delete({ where: { id: offerId } });
  } catch (err) {
    console.error("[deleteOffer/partner]", err);
    return { error: "Failed to delete offer" };
  }

  revalidateClub(clubId);
  return {};
}

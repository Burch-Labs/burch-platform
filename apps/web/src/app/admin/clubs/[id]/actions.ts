"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { isAdminRole } from "@/lib/roles";

async function requireAdmin() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Forbidden");
  }
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
    isFeatured: data.has("isFeatured"),
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
  revalidatePath(`/admin/clubs/${clubId}`);
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
    await requireAdmin();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const fields = parseOfferFormData(data);
  const validationError = validateOfferFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.clubHappening.create({
      data: { ...fields, clubId },
    });
  } catch (err) {
    console.error("[createOffer]", err);
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
    await requireAdmin();
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
    console.error("[updateOffer]", err);
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
    await requireAdmin();
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
    console.error("[deleteOffer]", err);
    return { error: "Failed to delete offer" };
  }

  revalidateClub(clubId);
  return {};
}

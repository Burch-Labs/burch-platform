"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ClubCategory, ClubAccess } from "@prisma/client";
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
  const holesRaw = data.get("holes") as string | null;
  const parRaw = data.get("par") as string | null;
  const visitorFeeRaw = data.get("visitorFee") as string | null;
  return {
    name:         (data.get("name") as string).trim(),
    description:  (data.get("description") as string | null)?.trim() || null,
    imageUrl:     (data.get("imageUrl") as string | null)?.trim() || null,
    city:         (data.get("city") as string).trim(),
    location:     (data.get("location") as string).trim(),
    category:     (data.get("category") as ClubCategory) ?? "GOLF",
    access:       (data.get("access") as ClubAccess) ?? "BY_ARRANGEMENT",
    holes:        holesRaw ? parseInt(holesRaw, 10) : null,
    par:          parRaw ? parseInt(parRaw, 10) : null,
    visitorFee:   visitorFeeRaw ? parseFloat(visitorFeeRaw) : null,
    currency:     (data.get("currency") as string | null)?.trim() || "KES",
    visitorNotes: (data.get("visitorNotes") as string | null)?.trim() || null,
    phone:        (data.get("phone") as string | null)?.trim() || null,
    email:        (data.get("email") as string | null)?.trim() || null,
    website:      (data.get("website") as string | null)?.trim() || null,
    amenities:    ((data.get("amenities") as string | null) ?? "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
    published:    data.has("published"),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createClub(
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
  if (!fields.name)     return { error: "Club name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.club.create({
      data: { ...fields, partnerId: partner.id },
    });
  } catch (err) {
    console.error("[createClub]", err);
    return { error: "Failed to create club" };
  }

  revalidatePath("/clubs");
  revalidatePath("/partner/clubs");

  redirect("/partner/clubs");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateClub(
  clubId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.club.findFirst({
    where: { id: clubId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Club not found or access denied" };

  const fields = parseFormData(data);
  if (!fields.name)     return { error: "Club name is required" };
  if (!fields.city)     return { error: "City is required" };
  if (!fields.location) return { error: "Address / location is required" };

  try {
    await prisma.club.update({
      where: { id: clubId },
      data:  fields,
    });
  } catch (err) {
    console.error("[updateClub]", err);
    return { error: "Failed to update club" };
  }

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/partner/clubs");

  redirect("/partner/clubs");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteClub(clubId: string): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.club.findFirst({
    where: { id: clubId, partnerId: partner.id },
    select: { id: true },
  });
  if (!existing) return { error: "Club not found or access denied" };

  try {
    await prisma.club.delete({ where: { id: clubId } });
  } catch (err) {
    console.error("[deleteClub]", err);
    return { error: "Failed to delete club" };
  }

  revalidatePath("/clubs");
  revalidatePath(`/clubs/${clubId}`);
  revalidatePath("/partner/clubs");

  return {};
}

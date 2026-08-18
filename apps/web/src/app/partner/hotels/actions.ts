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
    images:       (data.getAll("images") as string[]).map((s) => s.trim()).filter(Boolean),
    city:         (data.get("city") as string).trim(),
    location:     (data.get("location") as string).trim(),
    starRating:   starRatingRaw ? parseInt(starRatingRaw, 10) : null,
    amenities:    ((data.get("amenities") as string | null) ?? "")
                    .split(",")
                    .map((a) => a.trim())
                    .filter(Boolean),
    phone:        (data.get("phone") as string | null)?.trim() || null,
    email:        (data.get("email") as string | null)?.trim() || null,
    website:      (data.get("website") as string | null)?.trim() || null,
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
  revalidateTag("hotels-listing");
  revalidatePath("/hotels");
  revalidatePath("/partner/hotels");

  redirect("/partner/hotels");
}

// ─── Update ───────────────────────────────────────────────────────────────────

/**
 * True if this session may edit the given hotel: its owning partner, or any
 * admin. Admins can fix up any listing's info regardless of who owns it —
 * useful for curating real venue data (seeded or partner-submitted) without
 * needing to also own a partner profile for every business on the platform.
 */
async function canEditHotel(hotelId: string): Promise<boolean> {
  const session = await getServerSession(authOptions);
  if (!session) return false;
  if (isAdminRole(session.user.role)) {
    return !!(await prisma.hotel.findUnique({ where: { id: hotelId }, select: { id: true } }));
  }
  if (session.user.role !== "PARTNER") return false;
  const partner = await prisma.partner.findUnique({ where: { userId: session.user.id }, select: { id: true } });
  if (!partner) return false;
  const owned = await prisma.hotel.findFirst({ where: { id: hotelId, partnerId: partner.id }, select: { id: true } });
  return !!owned;
}

export async function updateHotel(
  hotelId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  if (!(await canEditHotel(hotelId))) {
    return { error: "Hotel not found or access denied" };
  }

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
  revalidateTag("hotels-listing");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  revalidatePath("/partner/hotels");
  revalidatePath("/admin/hotels");

  // An admin editing someone else's hotel has no partner profile of their
  // own, so /partner/hotels would just bounce them to onboarding — send
  // them back to the admin listing instead.
  const session = await getServerSession(authOptions);
  redirect(isAdminRole(session?.user?.role) ? "/admin/hotels" : "/partner/hotels");
}

// ─── JSON import (admin) ──────────────────────────────────────────────────────

/**
 * Bulk-friendly alternative to the field-by-field form: paste a JSON object
 * with any subset of hotel fields and it's applied as a partial update. Built
 * for curating real venue data from research — image URLs can point straight
 * at a source's own hosting, no upload step required.
 */
export async function importHotelJson(
  hotelId: string,
  _prev: { error?: string; success?: boolean } | null,
  data: FormData,
): Promise<{ error?: string; success?: boolean }> {
  if (!(await canEditHotel(hotelId))) {
    return { error: "Hotel not found or access denied" };
  }

  const raw = (data.get("json") as string | null) ?? "";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return { error: "That's not valid JSON — check for a stray comma or missing quote." };
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return { error: "JSON must be a single object, not an array or primitive." };
  }

  const fields: Record<string, unknown> = {};

  if ("name" in parsed) {
    const name = typeof parsed.name === "string" ? parsed.name.trim() : "";
    if (!name) return { error: "\"name\" can't be empty" };
    fields.name = name;
  }
  if ("city" in parsed) {
    const city = typeof parsed.city === "string" ? parsed.city.trim() : "";
    if (!city) return { error: "\"city\" can't be empty" };
    fields.city = city;
  }
  if ("location" in parsed) {
    const location = typeof parsed.location === "string" ? parsed.location.trim() : "";
    if (!location) return { error: "\"location\" can't be empty" };
    fields.location = location;
  }
  if ("description" in parsed) {
    fields.description = typeof parsed.description === "string" ? parsed.description.trim() || null : null;
  }
  if ("imageUrl" in parsed) {
    fields.imageUrl = typeof parsed.imageUrl === "string" ? parsed.imageUrl.trim() || null : null;
  }
  if ("images" in parsed) {
    fields.images = Array.isArray(parsed.images)
      ? parsed.images.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : [];
  }
  if ("starRating" in parsed) {
    fields.starRating = typeof parsed.starRating === "number" ? parsed.starRating : null;
  }
  if ("amenities" in parsed) {
    fields.amenities = Array.isArray(parsed.amenities)
      ? parsed.amenities.filter((x): x is string => typeof x === "string" && x.trim().length > 0)
      : typeof parsed.amenities === "string"
        ? parsed.amenities.split(",").map((a) => a.trim()).filter(Boolean)
        : [];
  }
  if ("phone" in parsed) {
    fields.phone = typeof parsed.phone === "string" ? parsed.phone.trim() || null : null;
  }
  if ("email" in parsed) {
    fields.email = typeof parsed.email === "string" ? parsed.email.trim() || null : null;
  }
  if ("website" in parsed) {
    fields.website = typeof parsed.website === "string" ? parsed.website.trim() || null : null;
  }
  if ("checkInTime" in parsed) {
    fields.checkInTime = typeof parsed.checkInTime === "string" ? parsed.checkInTime.trim() || "14:00" : "14:00";
  }
  if ("checkOutTime" in parsed) {
    fields.checkOutTime = typeof parsed.checkOutTime === "string" ? parsed.checkOutTime.trim() || "11:00" : "11:00";
  }
  if ("published" in parsed) {
    fields.published = typeof parsed.published === "boolean" ? parsed.published : false;
  }

  try {
    await prisma.hotel.update({ where: { id: hotelId }, data: fields });
  } catch (err) {
    console.error("[importHotelJson]", err);
    return { error: "Failed to save — check that field types match (starRating is a number, published is true/false)." };
  }

  revalidateTag("hotels-listing");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  revalidatePath("/partner/hotels");
  revalidatePath("/admin/hotels");

  return { success: true };
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

  revalidateTag("hotels-listing");
  revalidatePath("/hotels");
  revalidatePath(`/hotels/${hotelId}`);
  revalidatePath("/partner/hotels");

  return {};
}

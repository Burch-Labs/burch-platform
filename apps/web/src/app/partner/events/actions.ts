"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath, revalidateTag } from "next/cache";
import { EventCategory } from "@prisma/client";
import { redirect } from "next/navigation";
import { Client as ObjectStorageClient } from "@replit/object-storage";
import { isAdminRole } from "@/lib/roles";

// ─── storage helpers ──────────────────────────────────────────────────────────

/**
 * Deletes an event image from Replit Object Storage.
 *
 * Only acts on URLs produced by our own upload route (/api/images/event-images/…).
 * The key must match the exact format the upload route generates:
 *   event-images/<digits>-<alphanumeric>.<ext>
 * This prevents deletion of arbitrary storage keys even if a partner somehow
 * stored a crafted URL in their event record.
 *
 * A failed cleanup is logged but never throws so callers are not blocked.
 */
async function deleteStorageImage(imageUrl: string | null | undefined) {
  if (!imageUrl) return;

  // Must be a relative URL served by our image proxy
  const urlPrefix = "/api/images/";
  if (!imageUrl.startsWith(urlPrefix)) return;

  const objectKey = imageUrl.slice(urlPrefix.length);

  // Enforce the event-images/ namespace used by the upload route
  if (!objectKey.startsWith("event-images/")) return;

  // Validate the key matches the exact pattern the upload route generates:
  // event-images/<unix-ms>-<random-alphanum>.<jpg|jpeg|png|webp|gif>
  const keyPattern = /^event-images\/\d+-[a-z0-9]+\.(jpg|jpeg|png|webp|gif)$/;
  if (!keyPattern.test(objectKey)) {
    console.warn("[deleteStorageImage] Skipping deletion — unexpected key format:", objectKey);
    return;
  }

  try {
    const client = new ObjectStorageClient();
    const result = await client.delete(objectKey);
    if (!result.ok) {
      console.error("[deleteStorageImage] Storage delete failed for key:", objectKey, result.error);
    }
  } catch (err) {
    console.error("[deleteStorageImage] Unexpected error deleting key:", objectKey, err);
  }
}

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
  return {
    title:       (data.get("title") as string).trim(),
    description: (data.get("description") as string | null)?.trim() ?? null,
    imageUrl:    (data.get("imageUrl") as string | null)?.trim() || null,
    category:    (data.get("category") as EventCategory) ?? "OTHER",
    city:        (data.get("city") as string).trim(),
    location:    (data.get("location") as string).trim(),
    startDate:   new Date(data.get("startDate") as string),
    endDate:     new Date(data.get("endDate") as string),
    price:       parseFloat(data.get("price") as string),
    currency:    (data.get("currency") as string).trim() || "KES",
    capacity:    parseInt(data.get("capacity") as string, 10),
    published:   data.has("published"),
  };
}

// ─── Create ───────────────────────────────────────────────────────────────────

export async function createEvent(
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
  if (!fields.title)         return { error: "Title is required" };
  if (!fields.location)      return { error: "Location is required" };
  if (!fields.city)          return { error: "City is required" };
  if (isNaN(fields.price))   return { error: "Price must be a number" };
  if (isNaN(fields.capacity))return { error: "Capacity must be a number" };
  if (fields.published && fields.startDate < new Date()) {
    return { error: "Cannot publish an event whose start date is in the past. Save it as a draft instead." };
  }

  try {
    await prisma.event.create({
      data: { ...fields, partnerId: partner.id },
    });
  } catch (err) {
    console.error("[createEvent]", err);
    return { error: "Failed to create event" };
  }

  // Bust the events listing cache so the new event appears immediately
  revalidateTag("events-listing");
  revalidatePath("/");
  revalidatePath("/partner/events");

  redirect("/partner/events");
}

// ─── Update ───────────────────────────────────────────────────────────────────

export async function updateEvent(
  eventId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  // Verify ownership and capture current imageUrl so we can clean it up if replaced
  const existing = await prisma.event.findFirst({
    where: { id: eventId, partnerId: partner.id },
    select: { id: true, published: true, imageUrl: true },
  });
  if (!existing) return { error: "Event not found or access denied" };

  const fields = parseFormData(data);
  if (!fields.title)         return { error: "Title is required" };
  if (!fields.location)      return { error: "Location is required" };
  if (!fields.city)          return { error: "City is required" };
  if (isNaN(fields.price))   return { error: "Price must be a number" };
  if (isNaN(fields.capacity))return { error: "Capacity must be a number" };
  if (fields.published && fields.startDate < new Date()) {
    return { error: "Cannot publish an event whose start date is in the past. Save it as a draft instead." };
  }

  try {
    await prisma.event.update({
      where: { id: eventId },
      data:  fields,
    });
  } catch (err) {
    console.error("[updateEvent]", err);
    return { error: "Failed to update event" };
  }

  // If the photo was replaced or removed, clean up the old file from object storage
  if (existing.imageUrl && existing.imageUrl !== fields.imageUrl) {
    await deleteStorageImage(existing.imageUrl);
  }

  // Bust the events listing cache whenever a published event changes (or is published now)
  revalidateTag("events-listing");
  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/organizer/${partner.id}`);
  revalidatePath("/partner/events");

  redirect("/partner/events");
}

// ─── Delete ───────────────────────────────────────────────────────────────────

export async function deleteEvent(eventId: string): Promise<{ error?: string }> {
  let partner;
  try {
    partner = await requirePartner();
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.event.findFirst({
    where: { id: eventId, partnerId: partner.id },
    select: { id: true, imageUrl: true },
  });
  if (!existing) return { error: "Event not found or access denied" };

  try {
    await prisma.event.delete({ where: { id: eventId } });
  } catch (err) {
    console.error("[deleteEvent]", err);
    return { error: "Failed to delete event" };
  }

  // Remove the event's photo from object storage now that the record is gone
  await deleteStorageImage(existing.imageUrl);

  revalidateTag("events-listing");
  revalidatePath("/");
  revalidatePath(`/events/${eventId}`);
  revalidatePath(`/organizer/${partner.id}`);
  revalidatePath("/partner/events");

  return {};
}

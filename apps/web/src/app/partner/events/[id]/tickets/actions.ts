"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { isAdminRole } from "@/lib/roles";

async function requirePartnerEvent(eventId: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && !isAdminRole(session.user.role))) {
    throw new Error("Forbidden");
  }
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) throw new Error("Partner profile not found");

  const event = await prisma.event.findFirst({
    where: { id: eventId, partnerId: partner.id },
    select: { id: true },
  });
  if (!event) throw new Error("Event not found or access denied");

  return { partner, event };
}

function revalidateEvent(eventId: string) {
  revalidatePath(`/partner/events/${eventId}/tickets`);
  revalidatePath(`/events/${eventId}`);
  revalidatePath("/events");
}

// ─── Ticket tiers ─────────────────────────────────────────────────────────────

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "ZAR"];

function parseTierFormData(data: FormData) {
  const salesStartRaw = (data.get("salesStart") as string | null)?.trim() ?? "";
  const salesEndRaw = (data.get("salesEnd") as string | null)?.trim() ?? "";

  return {
    name: (data.get("name") as string).trim(),
    price: parseFloat((data.get("price") as string | null)?.trim() ?? "0"),
    currency: (data.get("currency") as string | null)?.trim() || "KES",
    capacity: Math.max(1, parseInt((data.get("capacity") as string | null)?.trim() ?? "1", 10) || 1),
    salesStart: salesStartRaw ? new Date(salesStartRaw) : null,
    salesEnd: salesEndRaw ? new Date(salesEndRaw) : null,
    sortOrder: parseInt((data.get("sortOrder") as string | null)?.trim() ?? "0", 10) || 0,
    isActive: data.has("isActive"),
  };
}

function validateTierFields(fields: ReturnType<typeof parseTierFormData>): string | null {
  if (!fields.name) return "Tier name is required";
  if (!CURRENCIES.includes(fields.currency)) return `Currency must be one of: ${CURRENCIES.join(", ")}`;
  if (!isFinite(fields.price) || fields.price < 0) return "Price must be zero or a positive number";
  if (fields.capacity < 1) return "Capacity must be at least 1";
  if (fields.salesStart && isNaN(fields.salesStart.getTime())) return "Sales start date is invalid";
  if (fields.salesEnd && isNaN(fields.salesEnd.getTime())) return "Sales end date is invalid";
  if (fields.salesStart && fields.salesEnd && fields.salesEnd < fields.salesStart) {
    return "Sales end can't be before sales start";
  }
  return null;
}

export async function createTier(
  eventId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const fields = parseTierFormData(data);
  const validationError = validateTierFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.ticketTier.create({ data: { ...fields, eventId } });
  } catch (err) {
    console.error("[createTier]", err);
    return { error: "Failed to create tier" };
  }

  revalidateEvent(eventId);
  return {};
}

export async function updateTier(
  eventId: string,
  tierId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.ticketTier.findFirst({ where: { id: tierId, eventId }, select: { id: true } });
  if (!existing) return { error: "Tier not found" };

  const fields = parseTierFormData(data);
  const validationError = validateTierFields(fields);
  if (validationError) return { error: validationError };

  try {
    await prisma.ticketTier.update({ where: { id: tierId }, data: fields });
  } catch (err) {
    console.error("[updateTier]", err);
    return { error: "Failed to update tier" };
  }

  revalidateEvent(eventId);
  return {};
}

export async function deleteTier(eventId: string, tierId: string): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const tier = await prisma.ticketTier.findFirst({ where: { id: tierId, eventId }, select: { id: true } });
  if (!tier) return { error: "Tier not found or access denied" };

  try {
    await prisma.ticketTier.delete({ where: { id: tierId } });
  } catch (err) {
    console.error("[deleteTier]", err);
    return { error: "Failed to delete tier" };
  }

  revalidateEvent(eventId);
  return {};
}

// ─── Discount codes ───────────────────────────────────────────────────────────

function parseDiscountFormData(data: FormData) {
  const expiresAtRaw = (data.get("expiresAt") as string | null)?.trim() ?? "";
  const maxUsesRaw = (data.get("maxUses") as string | null)?.trim() ?? "";

  return {
    code: (data.get("code") as string).trim().toUpperCase(),
    type: (data.get("type") as string) === "FIXED_AMOUNT" ? "FIXED_AMOUNT" as const : "PERCENTAGE" as const,
    value: parseFloat((data.get("value") as string | null)?.trim() ?? "0"),
    maxUses: maxUsesRaw ? Math.max(1, parseInt(maxUsesRaw, 10) || 1) : null,
    expiresAt: expiresAtRaw ? new Date(expiresAtRaw) : null,
    isActive: data.has("isActive"),
  };
}

function validateDiscountFields(fields: ReturnType<typeof parseDiscountFormData>): string | null {
  if (!fields.code) return "Code is required";
  if (!/^[A-Z0-9_-]+$/.test(fields.code)) return "Code can only contain letters, numbers, - and _";
  if (!isFinite(fields.value) || fields.value <= 0) return "Value must be a positive number";
  if (fields.type === "PERCENTAGE" && fields.value > 100) return "A percentage discount can't exceed 100";
  if (fields.expiresAt && isNaN(fields.expiresAt.getTime())) return "Expiry date is invalid";
  return null;
}

export async function createDiscountCode(
  eventId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const fields = parseDiscountFormData(data);
  const validationError = validateDiscountFields(fields);
  if (validationError) return { error: validationError };

  const existing = await prisma.discountCode.findUnique({ where: { code: fields.code }, select: { id: true } });
  if (existing) return { error: `Code "${fields.code}" is already in use.` };

  try {
    await prisma.discountCode.create({ data: { ...fields, eventId } });
  } catch (err) {
    console.error("[createDiscountCode]", err);
    return { error: "Failed to create discount code" };
  }

  revalidateEvent(eventId);
  return {};
}

export async function updateDiscountCode(
  eventId: string,
  discountId: string,
  _prev: { error?: string } | null,
  data: FormData,
): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const existing = await prisma.discountCode.findFirst({ where: { id: discountId, eventId }, select: { id: true } });
  if (!existing) return { error: "Discount code not found" };

  const fields = parseDiscountFormData(data);
  const validationError = validateDiscountFields(fields);
  if (validationError) return { error: validationError };

  const codeClash = await prisma.discountCode.findFirst({
    where: { code: fields.code, id: { not: discountId } },
    select: { id: true },
  });
  if (codeClash) return { error: `Code "${fields.code}" is already in use.` };

  try {
    await prisma.discountCode.update({ where: { id: discountId }, data: fields });
  } catch (err) {
    console.error("[updateDiscountCode]", err);
    return { error: "Failed to update discount code" };
  }

  revalidateEvent(eventId);
  return {};
}

export async function deleteDiscountCode(eventId: string, discountId: string): Promise<{ error?: string }> {
  try {
    await requirePartnerEvent(eventId);
  } catch (e: unknown) {
    return { error: (e as Error).message };
  }

  const discount = await prisma.discountCode.findFirst({ where: { id: discountId, eventId }, select: { id: true } });
  if (!discount) return { error: "Discount code not found or access denied" };

  try {
    await prisma.discountCode.delete({ where: { id: discountId } });
  } catch (err) {
    console.error("[deleteDiscountCode]", err);
    return { error: "Failed to delete discount code" };
  }

  revalidateEvent(eventId);
  return {};
}

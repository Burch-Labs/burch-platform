"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

// ─── Partner actions ──────────────────────────────────────────────────────────

/** Verify the current partner owns the booking's hotel/event/restaurant. */
async function getPartnerBooking(bookingId: string, partnerId: string) {
  return prisma.booking.findFirst({
    where: {
      id: bookingId,
      OR: [
        { hotel:      { partnerId } },
        { event:      { partnerId } },
        { restaurant: { partnerId } },
      ],
    },
    select: { id: true, status: true },
  });
}

export async function partnerConfirmBooking(bookingId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER") return { error: "Forbidden" };

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: "Partner record not found" };

  const booking = await getPartnerBooking(bookingId, partner.id);
  if (!booking) return { error: "Booking not found" };
  if (booking.status !== "PENDING") return { error: "Only PENDING bookings can be confirmed" };

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });
  revalidatePath("/dashboard");
  return {};
}

export async function partnerCancelBooking(bookingId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER") return { error: "Forbidden" };

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: "Partner record not found" };

  const booking = await getPartnerBooking(bookingId, partner.id);
  if (!booking) return { error: "Booking not found" };
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { error: "Only PENDING or CONFIRMED bookings can be cancelled" };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });
  revalidatePath("/dashboard");
  return {};
}

export async function partnerConfirmReservation(reservationId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER") return { error: "Forbidden" };

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: "Partner record not found" };

  const reservation = await prisma.tableReservation.findFirst({
    where: { id: reservationId, restaurant: { partnerId: partner.id } },
    select: { id: true, status: true },
  });
  if (!reservation) return { error: "Reservation not found" };
  if (reservation.status !== "PENDING") return { error: "Only PENDING reservations can be confirmed" };

  await prisma.tableReservation.update({
    where: { id: reservationId },
    data: { status: "CONFIRMED" },
  });
  revalidatePath("/dashboard");
  return {};
}

export async function partnerCancelReservation(reservationId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "PARTNER") return { error: "Forbidden" };

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: "Partner record not found" };

  const reservation = await prisma.tableReservation.findFirst({
    where: { id: reservationId, restaurant: { partnerId: partner.id } },
    select: { id: true, status: true },
  });
  if (!reservation) return { error: "Reservation not found" };
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    return { error: "Only PENDING or CONFIRMED reservations can be cancelled" };
  }

  await prisma.tableReservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });
  revalidatePath("/dashboard");
  return {};
}

// ─── Customer actions ─────────────────────────────────────────────────────────

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, userId: true, status: true },
  });

  if (!booking) return { error: "Booking not found" };
  if (booking.userId !== session.user.id) return { error: "Forbidden" };
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { error: "Only pending or confirmed bookings can be cancelled" };
  }

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard");
  return {};
}

export async function cancelReservation(reservationId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not authenticated" };

  const reservation = await prisma.tableReservation.findUnique({
    where: { id: reservationId },
    select: { id: true, userId: true, status: true },
  });

  if (!reservation) return { error: "Reservation not found" };
  if (reservation.userId !== session.user.id) return { error: "Forbidden" };
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    return { error: "Only pending or confirmed reservations can be cancelled" };
  }

  await prisma.tableReservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });

  revalidatePath("/dashboard");
  return {};
}

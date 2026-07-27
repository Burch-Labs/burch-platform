"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

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

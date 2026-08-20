"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import {
  sendGuestHotelConfirmation,
  sendGuestReservationConfirmation,
  sendGuestRequestDeclined,
  sendPartnerBookingCancelledAlert,
} from "@/lib/email";

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
    select: {
      id: true,
      status: true,
      type: true,
      checkIn: true,
      checkOut: true,
      totalAmount: true,
      currency: true,
      user: { select: { name: true, email: true } },
      hotel: { select: { name: true } },
    },
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
  if (booking.type === "EVENT") {
    // Event tickets are confirmed automatically by the payment webhook once
    // M-Pesa/Pesapal settles — a partner can't hand-confirm an unpaid one.
    return { error: "Event tickets confirm automatically once payment completes." };
  }

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CONFIRMED" } });

  if (booking.type === "HOTEL" && booking.user?.email && booking.checkIn && booking.checkOut && booking.hotel) {
    const guestEmail = booking.user.email;
    await sendGuestHotelConfirmation({
      guestEmail,
      guestName: booking.user.name ?? guestEmail,
      propertyName: booking.hotel.name,
      checkIn: booking.checkIn,
      checkOut: booking.checkOut,
      nights: Math.max(1, Math.round((booking.checkOut.getTime() - booking.checkIn.getTime()) / (1000 * 60 * 60 * 24))),
      totalAmount: Number(booking.totalAmount),
      currency: booking.currency,
    }).catch((err) => console.error("[guest-confirm] partner-confirmed hotel booking email failed:", err));
  }

  revalidatePath("/dashboard");
  revalidatePath("/partner/bookings");
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

  const wasPendingEnquiry = booking.status === "PENDING";

  await prisma.booking.update({ where: { id: bookingId }, data: { status: "CANCELLED" } });

  if (booking.type === "EVENT") {
    // A stuck/abandoned M-Pesa or Pesapal attempt shouldn't be able to
    // resurrect this booking if its callback finally lands after the fact.
    await prisma.payment.updateMany({
      where: { bookingId, status: "PENDING" },
      data: { status: "FAILED" },
    });
    // Same reason as the guest-initiated cancel path: a VALID ticket on a
    // CANCELLED booking would still admit at the door.
    await prisma.ticket.updateMany({
      where: { bookingId, status: "VALID" },
      data: { status: "VOID" },
    });
  } else if (wasPendingEnquiry && booking.user?.email && booking.hotel) {
    const guestEmail = booking.user.email;
    await sendGuestRequestDeclined({
      guestEmail,
      guestName: booking.user.name ?? guestEmail,
      propertyName: booking.hotel.name,
      propertyType: "hotel",
    }).catch((err) => console.error("[guest-decline] hotel booking email failed:", err));
  }

  revalidatePath("/dashboard");
  revalidatePath("/partner/bookings");
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
    select: {
      id: true,
      status: true,
      name: true,
      email: true,
      date: true,
      partySize: true,
      restaurant: { select: { name: true } },
    },
  });
  if (!reservation) return { error: "Reservation not found" };
  if (reservation.status !== "PENDING") return { error: "Only PENDING reservations can be confirmed" };

  await prisma.tableReservation.update({
    where: { id: reservationId },
    data: { status: "CONFIRMED" },
  });

  await sendGuestReservationConfirmation({
    guestEmail: reservation.email,
    guestName: reservation.name,
    restaurantName: reservation.restaurant.name,
    dateTime: reservation.date,
    partySize: reservation.partySize,
  }).catch((err) => console.error("[guest-confirm] partner-confirmed reservation email failed:", err));

  revalidatePath("/dashboard");
  revalidatePath("/partner/bookings");
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
    select: {
      id: true,
      status: true,
      name: true,
      email: true,
      restaurant: { select: { name: true } },
    },
  });
  if (!reservation) return { error: "Reservation not found" };
  if (reservation.status !== "PENDING" && reservation.status !== "CONFIRMED") {
    return { error: "Only PENDING or CONFIRMED reservations can be cancelled" };
  }

  const wasPendingEnquiry = reservation.status === "PENDING";

  await prisma.tableReservation.update({
    where: { id: reservationId },
    data: { status: "CANCELLED" },
  });

  if (wasPendingEnquiry) {
    await sendGuestRequestDeclined({
      guestEmail: reservation.email,
      guestName: reservation.name,
      propertyName: reservation.restaurant.name,
      propertyType: "restaurant",
    }).catch((err) => console.error("[guest-decline] reservation email failed:", err));
  }

  revalidatePath("/dashboard");
  revalidatePath("/partner/bookings");
  return {};
}

// ─── Customer actions ─────────────────────────────────────────────────────────

/** No cancellations within this many hours of check-in / event start. */
const CANCELLATION_CUTOFF_HOURS = 24;

export async function cancelBooking(bookingId: string): Promise<{ error?: string }> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "Not authenticated" };

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      type: true,
      quantity: true,
      checkIn: true,
      user: { select: { name: true, email: true } },
      event: {
        select: {
          title: true,
          startDate: true,
          partner: { select: { user: { select: { email: true, name: true } } } },
        },
      },
      hotel: {
        select: {
          name: true,
          partner: { select: { user: { select: { email: true, name: true } } } },
        },
      },
      restaurant: {
        select: {
          name: true,
          partner: { select: { user: { select: { email: true, name: true } } } },
        },
      },
    },
  });

  if (!booking) return { error: "Booking not found" };
  if (booking.userId !== session.user.id) return { error: "Forbidden" };
  if (booking.status !== "PENDING" && booking.status !== "CONFIRMED") {
    return { error: "Only pending or confirmed bookings can be cancelled" };
  }

  // Enforce the cancellation window against check-in (hotels) or event start.
  const referenceDate = booking.checkIn ?? booking.event?.startDate ?? null;
  if (referenceDate) {
    const cutoff = new Date(referenceDate.getTime() - CANCELLATION_CUTOFF_HOURS * 60 * 60 * 1000);
    if (new Date() >= cutoff) {
      return {
        error: `Bookings can no longer be cancelled within ${CANCELLATION_CUTOFF_HOURS} hours of check-in. Please contact the partner directly.`,
      };
    }
  }

  const wasConfirmed = booking.status === "CONFIRMED";

  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: "CANCELLED" },
  });

  // If this was a paid event ticket with a payment still in flight, make sure
  // a late M-Pesa/Pesapal callback can't resurrect it. No-op for
  // hotel/restaurant bookings, which never have Payment rows.
  await prisma.payment.updateMany({
    where: { bookingId, status: "PENDING" },
    data: { status: "FAILED" },
  });

  // A cancelled booking's tickets must stop admitting — a VALID ticket on a
  // CANCELLED booking is a ticket that got refunded but would still let its
  // holder through the door.
  if (booking.type === "EVENT") {
    await prisma.ticket.updateMany({
      where: { bookingId, status: "VALID" },
      data: { status: "VOID" },
    });
  }

  // Alert the partner only when they lost something they already had —
  // a PENDING enquiry going away isn't news to anyone yet.
  if (wasConfirmed) {
    const guestName = booking.user.name ?? booking.user.email ?? "A guest";
    const property =
      booking.type === "EVENT" ? booking.event
      : booking.type === "HOTEL" ? booking.hotel
      : booking.restaurant;
    const partnerUser = property?.partner?.user;

    if (partnerUser?.email) {
      const propertyName =
        booking.type === "EVENT" ? booking.event?.title
        : booking.type === "HOTEL" ? booking.hotel?.name
        : booking.restaurant?.name;
      const bookingDetail =
        booking.type === "EVENT" ? `${booking.quantity} ticket${booking.quantity !== 1 ? "s" : ""}`
        : booking.type === "HOTEL" ? "Stay booking"
        : "Table reservation";

      await sendPartnerBookingCancelledAlert({
        partnerEmail: partnerUser.email,
        partnerName: partnerUser.name ?? "Partner",
        guestName,
        propertyName: propertyName ?? "your listing",
        propertyType: booking.type === "EVENT" ? "event" : booking.type === "HOTEL" ? "hotel" : "restaurant",
        bookingDetail,
      }).catch((err) => console.error("[partner-alert] booking cancellation email failed:", err));
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/bookings");
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
  revalidatePath("/bookings");
  return {};
}

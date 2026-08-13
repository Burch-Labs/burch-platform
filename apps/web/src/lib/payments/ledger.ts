/**
 * Shared booking/payment state transitions for paid event tickets.
 * Both the M-Pesa callback and the Flutterwave webhook funnel through the
 * same two transitions here, so "what happens when a payment succeeds or
 * fails" only lives in one place.
 */

import { prisma } from "@/lib/prisma";
import type { PaymentProvider, Prisma } from "@prisma/client";
import { generateCheckInToken } from "@/lib/tickets";

export class CapacityError extends Error {}

/**
 * Checks remaining capacity and creates the booking in one transaction.
 * Bookings that were CANCELLED (payment failed/expired) don't count against
 * capacity, so a failed M-Pesa attempt doesn't permanently hold a seat.
 */
export async function reserveEventBooking(params: {
  userId: string;
  eventId: string;
  quantity: number;
  capacity: number;
  unitPrice: number;
  currency: string;
  status: "PENDING" | "CONFIRMED";
}) {
  const { userId, eventId, quantity, capacity, unitPrice, currency, status } = params;

  return prisma.$transaction(async (tx) => {
    const totalBooked = await tx.booking.aggregate({
      where: { eventId, status: { not: "CANCELLED" } },
      _sum: { quantity: true },
    });
    const booked = totalBooked._sum.quantity ?? 0;
    if (booked + quantity > capacity) {
      throw new CapacityError(`Only ${Math.max(0, capacity - booked)} tickets remaining.`);
    }

    return tx.booking.create({
      data: {
        userId,
        type: "EVENT",
        status,
        quantity,
        totalAmount: unitPrice * quantity,
        currency,
        eventId,
        // Paid bookings get their check-in token once payment actually succeeds
        // (see markPaymentSuccess) — a PENDING ticket isn't a real ticket yet.
        checkInToken: status === "CONFIRMED" ? generateCheckInToken() : undefined,
      },
    });
  });
}

export async function createPendingPayment(params: {
  bookingId: string;
  provider: PaymentProvider;
  amount: number;
  currency: string;
  phone?: string;
}) {
  return prisma.payment.create({
    data: {
      bookingId: params.bookingId,
      provider: params.provider,
      status: "PENDING",
      amount: params.amount,
      currency: params.currency,
      phone: params.phone,
    },
  });
}

export async function attachProviderRef(paymentId: string, providerRef: string) {
  return prisma.payment.update({ where: { id: paymentId }, data: { providerRef } });
}

export const bookingWithContext = {
  include: {
    user: { select: { id: true, name: true, email: true } },
    event: {
      select: {
        title: true,
        startDate: true,
        partner: { select: { user: { select: { name: true, email: true } } } },
      },
    },
  },
} satisfies Prisma.BookingDefaultArgs;

export type BookingWithContext = Prisma.BookingGetPayload<typeof bookingWithContext>;

export async function markPaymentSuccess(params: {
  paymentId: string;
  receiptRef: string;
  rawCallback: unknown;
}): Promise<BookingWithContext> {
  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: "SUCCESS",
      receiptRef: params.receiptRef,
      rawCallback: params.rawCallback as Prisma.InputJsonValue,
    },
  });

  const existing = await prisma.booking.findUniqueOrThrow({
    where: { id: payment.bookingId },
    select: { checkInToken: true },
  });

  return prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: "CONFIRMED",
      paymentRef: params.receiptRef,
      paymentMethod: payment.provider,
      checkInToken: existing.checkInToken ?? generateCheckInToken(),
    },
    ...bookingWithContext,
  });
}

export async function markPaymentFailed(params: {
  paymentId: string;
  rawCallback?: unknown;
}): Promise<void> {
  const payment = await prisma.payment.update({
    where: { id: params.paymentId },
    data: {
      status: "FAILED",
      rawCallback: params.rawCallback as Prisma.InputJsonValue | undefined,
    },
  });

  // Only cancel the booking if no other payment attempt on it already succeeded
  // (defends against an out-of-order callback for a superseded retry).
  await prisma.booking.updateMany({
    where: { id: payment.bookingId, status: "PENDING" },
    data: { status: "CANCELLED" },
  });
}

export async function findPaymentByProviderRef(provider: PaymentProvider, providerRef: string) {
  return prisma.payment.findFirst({ where: { provider, providerRef } });
}

/**
 * Shared booking/payment state transitions for paid event tickets.
 * Both the M-Pesa callback and the Pesapal webhook funnel through the
 * same two transitions here, so "what happens when a payment succeeds or
 * fails" only lives in one place.
 */

import { prisma } from "@/lib/prisma";
import { issueTicketsForBooking } from "@/lib/tickets";
// Prisma is a value import here, not just a type: the isolation level below
// is a runtime enum member.
import { Prisma } from "@prisma/client";
import type { PaymentProvider } from "@prisma/client";

export class CapacityError extends Error {}
export class DiscountError extends Error {}

/**
 * Checks remaining capacity and creates the booking in one transaction.
 * Bookings that were CANCELLED (payment failed/expired) don't count against
 * capacity, so a failed M-Pesa attempt doesn't permanently hold a seat.
 *
 * When a tier is given, its capacity is checked the same way and in the same
 * transaction as the event's — a tier oversold is exactly as much of a
 * problem as the event as a whole being oversold. A pre-validated discount
 * code's usage cap is re-checked and incremented here too, for the same
 * reason: validating it before the transaction started is a fast-fail for a
 * dead/expired code, not the actual race guard for "two people redeem the
 * last use of a maxUses:1 code at once."
 */
export async function reserveEventBooking(params: {
  userId: string;
  eventId: string;
  quantity: number;
  capacity: number;
  unitPrice: number;
  currency: string;
  status: "PENDING" | "CONFIRMED";
  ticketTierId?: string;
  tierCapacity?: number;
  discountCodeId?: string;
  payAtGate?: boolean;
  /** Overrides unitPrice * quantity — the actual amount to charge after a
   * discount code is applied. Omit to charge full price. */
  totalAmountOverride?: number;
}) {
  const {
    userId, eventId, quantity, capacity, unitPrice, currency, status,
    ticketTierId, tierCapacity, discountCodeId, payAtGate, totalAmountOverride,
  } = params;

  return prisma.$transaction(
    async (tx) => {
      const totalBooked = await tx.booking.aggregate({
        where: { eventId, status: { not: "CANCELLED" } },
        _sum: { quantity: true },
      });
      const booked = totalBooked._sum.quantity ?? 0;
      if (booked + quantity > capacity) {
        throw new CapacityError(`Only ${Math.max(0, capacity - booked)} tickets remaining.`);
      }

      if (ticketTierId && tierCapacity !== undefined) {
        const tierBooked = await tx.booking.aggregate({
          where: { ticketTierId, status: { not: "CANCELLED" } },
          _sum: { quantity: true },
        });
        const tierSold = tierBooked._sum.quantity ?? 0;
        if (tierSold + quantity > tierCapacity) {
          throw new CapacityError(`Only ${Math.max(0, tierCapacity - tierSold)} tickets remaining in this tier.`);
        }
      }

      if (discountCodeId) {
        const discount = await tx.discountCode.findUnique({ where: { id: discountCodeId } });
        if (!discount || !discount.isActive) {
          throw new DiscountError("That promo code is no longer valid.");
        }
        if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
          throw new DiscountError("That promo code has just reached its usage limit.");
        }
        await tx.discountCode.update({
          where: { id: discountCodeId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return tx.booking.create({
        data: {
          userId,
          type: "EVENT",
          status,
          quantity,
          totalAmount: totalAmountOverride ?? unitPrice * quantity,
          currency,
          eventId,
          ticketTierId,
          discountCodeId,
          payAtGate: payAtGate ?? false,
        },
      });
    },
    { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
  );
}

export interface DiscountApplication {
  discountCodeId: string;
  discountApplied: number;
  finalAmount: number;
}

/**
 * Fast-fail validation before the booking transaction even starts — gives
 * the buyer an immediate, specific error ("expired", "wrong event") rather
 * than a generic failure. The transaction inside reserveEventBooking is
 * still what actually prevents two people redeeming the last use of the
 * same code at once; this is UX, not the race guard.
 */
export async function validateDiscountCode(params: {
  code: string;
  eventId: string;
  amount: number;
}): Promise<DiscountApplication> {
  const { eventId, amount } = params;
  const code = params.code.trim().toUpperCase();
  if (!code) throw new DiscountError("Enter a promo code.");

  const discount = await prisma.discountCode.findUnique({ where: { code } });
  if (!discount) throw new DiscountError("That promo code doesn't exist.");
  if (!discount.isActive) throw new DiscountError("That promo code is no longer active.");
  if (discount.expiresAt && discount.expiresAt < new Date()) {
    throw new DiscountError("That promo code has expired.");
  }
  if (discount.eventId && discount.eventId !== eventId) {
    throw new DiscountError("That promo code isn't valid for this event.");
  }
  if (discount.maxUses !== null && discount.usedCount >= discount.maxUses) {
    throw new DiscountError("That promo code has reached its usage limit.");
  }

  const rawValue = Number(discount.value);
  const discountApplied =
    discount.type === "PERCENTAGE"
      ? Math.round(amount * (rawValue / 100) * 100) / 100
      : Math.min(amount, rawValue);
  const finalAmount = Math.max(0, Math.round((amount - discountApplied) * 100) / 100);

  return { discountCodeId: discount.id, discountApplied, finalAmount };
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

  const booking = await prisma.booking.update({
    where: { id: payment.bookingId },
    data: {
      status: "CONFIRMED",
      paymentRef: params.receiptRef,
      paymentMethod: payment.provider,
    },
    ...bookingWithContext,
  });

  // Tickets exist only once money has actually arrived. issueTicketsForBooking
  // is idempotent, so a webhook and a browser redirect both confirming the same
  // payment still yield one set rather than two.
  if (booking.eventId) {
    await issueTicketsForBooking(booking.id, booking.eventId, booking.quantity);
  }

  return booking;
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

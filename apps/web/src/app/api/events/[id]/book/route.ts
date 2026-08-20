import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { configBaseUrl } from "@/lib/config-check";
import { HAS_MPESA, isValidMsisdn, stkPush } from "@/lib/payments/mpesa";
import { HAS_PESAPAL, submitOrder } from "@/lib/payments/pesapal";
import {
  CapacityError,
  DiscountError,
  attachProviderRef,
  bookingWithContext,
  createPendingPayment,
  markPaymentFailed,
  reserveEventBooking,
  validateDiscountCode,
} from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";
import { issueTicketsForBooking } from "@/lib/tickets";

const schema = z.object({
  quantity: z.number().int().min(1).max(10),
  method: z.enum(["mpesa", "pesapal"]).optional(),
  phone: z.string().optional(),
  ticketTierId: z.string().optional(),
  promoCode: z.string().trim().optional(),
  /** Reserve now, collect cash/M-Pesa in person at the door — no online charge. */
  payAtGate: z.boolean().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Sign in to purchase tickets." }, { status: 401 });
    }

    const { id } = await params;
    const { quantity, method, phone, ticketTierId, promoCode, payAtGate } = schema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, price: true, currency: true, capacity: true, published: true },
    });

    if (!event || !event.published) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // ── Resolve price: a tier overrides the event's flat price, but every
    //    event created before tiers existed still has one to fall back to ──
    let unitPrice = Number(event.price);
    let currency = event.currency;
    let tierCapacity: number | undefined;
    let resolvedTierId: string | undefined;

    if (ticketTierId) {
      const tier = await prisma.ticketTier.findFirst({
        where: { id: ticketTierId, eventId: id, isActive: true },
      });
      if (!tier) {
        return NextResponse.json({ error: "That ticket tier isn't available." }, { status: 400 });
      }
      const now = new Date();
      if (tier.salesStart && now < tier.salesStart) {
        return NextResponse.json({ error: "This tier isn't on sale yet." }, { status: 400 });
      }
      if (tier.salesEnd && now > tier.salesEnd) {
        return NextResponse.json({ error: "Sales for this tier have ended." }, { status: 400 });
      }
      unitPrice = Number(tier.price);
      currency = tier.currency;
      tierCapacity = tier.capacity;
      resolvedTierId = tier.id;
    }

    // ── Apply a promo code against the order total, before deciding whether
    //    this checkout is free, pay-at-gate, or actually charged online ──
    let totalAmount = unitPrice * quantity;
    let discountCodeId: string | undefined;
    if (promoCode) {
      try {
        const applied = await validateDiscountCode({ code: promoCode, eventId: id, amount: totalAmount });
        discountCodeId = applied.discountCodeId;
        totalAmount = applied.finalAmount;
      } catch (err) {
        if (err instanceof DiscountError) {
          return NextResponse.json({ error: err.message }, { status: 400 });
        }
        throw err;
      }
    }

    const isFree = totalAmount === 0;

    // ── Free (including a promo code that zeroes out the total): unchanged
    //    instant-confirm path ────────────────────────────────────────────
    if (isFree) {
      const booking = await reserveEventBooking({
        userId: session.user.id,
        eventId: id,
        quantity,
        capacity: event.capacity,
        unitPrice,
        currency,
        status: "CONFIRMED",
        ticketTierId: resolvedTierId,
        tierCapacity,
        discountCodeId,
        totalAmountOverride: 0,
      });

      await issueTicketsForBooking(booking.id, id, quantity);

      const withContext = await prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
        ...bookingWithContext,
      });
      notifyEventBookingConfirmed(withContext);

      return NextResponse.json({ booking }, { status: 201 });
    }

    // ── Pay at the gate: reserve and issue tickets now, exactly like a free
    //    ticket, but flagged so door staff know cash/M-Pesa is still owed ──
    if (payAtGate) {
      const booking = await reserveEventBooking({
        userId: session.user.id,
        eventId: id,
        quantity,
        capacity: event.capacity,
        unitPrice,
        currency,
        status: "CONFIRMED",
        ticketTierId: resolvedTierId,
        tierCapacity,
        discountCodeId,
        payAtGate: true,
        totalAmountOverride: totalAmount,
      });

      await issueTicketsForBooking(booking.id, id, quantity);

      const withContext = await prisma.booking.findUniqueOrThrow({
        where: { id: booking.id },
        ...bookingWithContext,
      });
      notifyEventBookingConfirmed(withContext);

      return NextResponse.json({ booking }, { status: 201 });
    }

    // ── Paid tickets: reserve capacity, create a PENDING booking + payment,
    //    then hand off to whichever gateway the guest picked ──────────────
    if (!method) {
      return NextResponse.json({ error: "Choose a payment method." }, { status: 400 });
    }
    if (method === "mpesa" && !HAS_MPESA) {
      return NextResponse.json({ error: "M-Pesa is not configured yet." }, { status: 503 });
    }
    if (method === "pesapal" && !HAS_PESAPAL) {
      return NextResponse.json({ error: "Card payment is not configured yet." }, { status: 503 });
    }
    if (method === "mpesa" && (!phone || !isValidMsisdn(phone))) {
      return NextResponse.json({ error: "Enter a valid M-Pesa phone number." }, { status: 400 });
    }

    const booking = await reserveEventBooking({
      userId: session.user.id,
      eventId: id,
      quantity,
      capacity: event.capacity,
      unitPrice,
      currency,
      status: "PENDING",
      ticketTierId: resolvedTierId,
      tierCapacity,
      discountCodeId,
      totalAmountOverride: totalAmount,
    });

    const provider = method === "mpesa" ? "MPESA" : "PESAPAL";
    const payment = await createPendingPayment({
      bookingId: booking.id,
      provider,
      amount: Number(booking.totalAmount),
      currency,
      phone: method === "mpesa" ? phone : undefined,
    });

    if (method === "mpesa") {
      try {
        const stk = await stkPush({
          phone: phone!,
          amount: Number(booking.totalAmount),
          accountReference: booking.id,
          transactionDesc: event.title,
          callbackUrl: `${configBaseUrl}/api/payments/mpesa/callback`,
        });
        await attachProviderRef(payment.id, stk.checkoutRequestId);

        return NextResponse.json(
          {
            booking: { id: booking.id, status: booking.status },
            payment: { id: payment.id, status: payment.status },
            checkoutRequestId: stk.checkoutRequestId,
            message: stk.customerMessage,
          },
          { status: 201 }
        );
      } catch (err) {
        await markPaymentFailed({ paymentId: payment.id });
        console.error("[POST /api/events/[id]/book] M-Pesa STK push failed:", err);
        return NextResponse.json({ error: "Could not start M-Pesa payment. Please try again." }, { status: 502 });
      }
    }

    // Pesapal
    if (!session.user.email) {
      await markPaymentFailed({ paymentId: payment.id });
      return NextResponse.json({ error: "Your account needs a verified email to pay by card." }, { status: 400 });
    }
    try {
      await attachProviderRef(payment.id, payment.id);
      const { redirectUrl } = await submitOrder({
        merchantReference: payment.id,
        amount: Number(booking.totalAmount),
        currency,
        description: event.title,
        callbackUrl: `${configBaseUrl}/api/payments/pesapal/callback`,
        customerEmail: session.user.email,
        customerName: session.user.name ?? undefined,
      });

      return NextResponse.json(
        {
          booking: { id: booking.id, status: booking.status },
          payment: { id: payment.id, status: payment.status },
          paymentLink: redirectUrl,
        },
        { status: 201 }
      );
    } catch (err) {
      await markPaymentFailed({ paymentId: payment.id });
      console.error("[POST /api/events/[id]/book] Pesapal initialize failed:", err);
      return NextResponse.json({ error: "Could not start card payment. Please try again." }, { status: 502 });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof CapacityError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    if (err instanceof DiscountError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/events/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

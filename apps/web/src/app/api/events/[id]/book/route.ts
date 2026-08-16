import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { configBaseUrl } from "@/lib/config-check";
import { HAS_MPESA, isValidMsisdn, stkPush } from "@/lib/payments/mpesa";
import { HAS_FLUTTERWAVE, initializePayment } from "@/lib/payments/flutterwave";
import {
  CapacityError,
  attachProviderRef,
  bookingWithContext,
  createPendingPayment,
  markPaymentFailed,
  reserveEventBooking,
} from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";
import { issueTicketsForBooking } from "@/lib/tickets";

const schema = z.object({
  quantity: z.number().int().min(1).max(10),
  method: z.enum(["mpesa", "flutterwave"]).optional(),
  phone: z.string().optional(),
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
    const { quantity, method, phone } = schema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { id },
      select: { id: true, title: true, price: true, currency: true, capacity: true, published: true },
    });

    if (!event || !event.published) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    const isFree = Number(event.price) === 0;

    // ── Free tickets: unchanged instant-confirm path ──────────────────────
    if (isFree) {
      const booking = await reserveEventBooking({
        userId: session.user.id,
        eventId: id,
        quantity,
        capacity: event.capacity,
        unitPrice: 0,
        currency: event.currency,
        status: "CONFIRMED",
      });

      // Free tickets confirm immediately, so they are issued here rather than
      // on a payment callback that will never arrive.
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
    if (method === "flutterwave" && !HAS_FLUTTERWAVE) {
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
      unitPrice: Number(event.price),
      currency: event.currency,
      status: "PENDING",
    });

    const provider = method === "mpesa" ? "MPESA" : "FLUTTERWAVE";
    const payment = await createPendingPayment({
      bookingId: booking.id,
      provider,
      amount: Number(booking.totalAmount),
      currency: event.currency,
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

    // Flutterwave
    if (!session.user.email) {
      await markPaymentFailed({ paymentId: payment.id });
      return NextResponse.json({ error: "Your account needs a verified email to pay by card." }, { status: 400 });
    }
    try {
      await attachProviderRef(payment.id, payment.id);
      const { paymentLink } = await initializePayment({
        txRef: payment.id,
        amount: Number(booking.totalAmount),
        currency: event.currency,
        redirectUrl: `${configBaseUrl}/api/payments/flutterwave/callback`,
        customerEmail: session.user.email,
        customerName: session.user.name ?? undefined,
        title: "dontbeboring Event Ticket",
        description: event.title,
      });

      return NextResponse.json(
        {
          booking: { id: booking.id, status: booking.status },
          payment: { id: payment.id, status: payment.status },
          paymentLink,
        },
        { status: 201 }
      );
    } catch (err) {
      await markPaymentFailed({ paymentId: payment.id });
      console.error("[POST /api/events/[id]/book] Flutterwave initialize failed:", err);
      return NextResponse.json({ error: "Could not start card payment. Please try again." }, { status: 502 });
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof CapacityError) {
      return NextResponse.json({ error: err.message }, { status: 409 });
    }
    console.error("[POST /api/events/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

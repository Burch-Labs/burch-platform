import { NextRequest, NextResponse } from "next/server";
import { createPayment, findPaymentByBookingId } from "@/lib/payments/ledger";
import { initiateStk, HAS_MPESA } from "@/lib/payments/mpesa";
import { initializePayment, HAS_FLUTTERWAVE } from "@/lib/payments/flutterwave";
import { createPaymentIntent, HAS_STRIPE } from "@/lib/payments/stripe";
import { configBaseUrl } from "@/lib/config-check";

interface InitiatePaymentRequest {
  bookingId: string;
  amount: number;
  currency: string;
  paymentMethod: "mpesa" | "flutterwave" | "stripe";
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  title: string;
  description: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: InitiatePaymentRequest = await req.json();

    const {
      bookingId,
      amount,
      currency,
      paymentMethod,
      customerName,
      customerEmail,
      customerPhone,
      title,
      description,
    } = body;

    if (!bookingId || !amount || !currency || !paymentMethod) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Check for existing pending payment
    const existingPayment = await findPaymentByBookingId(bookingId);
    if (existingPayment && existingPayment.status === "PENDING") {
      return NextResponse.json(
        { error: "Payment already in progress for this booking" },
        { status: 409 }
      );
    }

    // Create payment record in database
    const payment = await createPayment({
      bookingId,
      amount: String(amount),
      currency,
      provider: paymentMethod.toUpperCase(),
      status: "PENDING",
      customerEmail,
    });

    if (paymentMethod === "mpesa") {
      if (!HAS_MPESA) {
        return NextResponse.json(
          { error: "M-Pesa is not configured" },
          { status: 400 }
        );
      }

      const stkResult = await initiateStk({
        amount: Math.round(amount),
        accountReference: bookingId,
        partyA: customerPhone,
        callbackUrl: `${configBaseUrl}/api/payments/mpesa/callback`,
        transactionDesc: description,
      });

      // Store the CheckoutRequestID as provider reference
      await createPayment({
        ...payment,
        providerReference: stkResult.CheckoutRequestID,
      });

      return NextResponse.json({
        status: "initiated",
        method: "mpesa",
        message: "STK prompt sent to customer's phone",
        paymentId: payment.id,
      });
    }

    if (paymentMethod === "flutterwave") {
      if (!HAS_FLUTTERWAVE) {
        return NextResponse.json(
          { error: "Flutterwave is not configured" },
          { status: 400 }
        );
      }

      const redirectUrl = `${configBaseUrl}/api/payments/flutterwave/callback`;
      const flwResult = await initializePayment({
        txRef: payment.id,
        amount,
        currency,
        redirectUrl,
        customerEmail,
        customerName,
        title,
        description,
      });

      await createPayment({
        ...payment,
        providerReference: payment.id, // txRef
      });

      return NextResponse.json({
        status: "initiated",
        method: "flutterwave",
        paymentLink: flwResult.paymentLink,
        paymentId: payment.id,
      });
    }

    if (paymentMethod === "stripe") {
      if (!HAS_STRIPE) {
        return NextResponse.json(
          { error: "Stripe is not configured" },
          { status: 400 }
        );
      }

      const stripeResult = await createPaymentIntent({
        amount,
        currency,
        description,
        customerEmail,
        bookingId,
      });

      await createPayment({
        ...payment,
        providerReference: stripeResult.paymentIntentId,
      });

      return NextResponse.json({
        status: "initiated",
        method: "stripe",
        clientSecret: stripeResult.clientSecret,
        paymentIntentId: stripeResult.paymentIntentId,
        paymentId: payment.id,
      });
    }

    return NextResponse.json(
      { error: "Invalid payment method" },
      { status: 400 }
    );
  } catch (error) {
    console.error("[payment-initiate] error:", error);
    return NextResponse.json(
      { error: "Payment initiation failed" },
      { status: 500 }
    );
  }
}

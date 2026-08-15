import { NextRequest, NextResponse } from "next/server";
import { findPaymentByBookingId } from "@/lib/payments/ledger";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const bookingId = url.searchParams.get("bookingId");

    if (!bookingId) {
      return NextResponse.json(
        { error: "Missing bookingId parameter" },
        { status: 400 }
      );
    }

    const payment = await findPaymentByBookingId(bookingId);

    if (!payment) {
      return NextResponse.json(
        { error: "Payment not found", status: "not_found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      bookingId: payment.bookingId,
      status: payment.status,
      amount: payment.amount,
      currency: payment.currency,
      provider: payment.provider,
      providerReference: payment.providerReference,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });
  } catch (error) {
    console.error("[payment-verify] error:", error);
    return NextResponse.json(
      { error: "Payment verification failed" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import {
  extractCallbackValue,
  type MpesaStkCallback,
} from "@/lib/payments/mpesa";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

/**
 * Safaricom's Daraja callback for STK Push results. Public endpoint — no
 * session, no signature scheme on Daraja's side, so we only trust the
 * CheckoutRequestID to match a payment we ourselves initiated.
 *
 * Per Daraja's contract this must always respond 200 with ResultCode 0 —
 * the response body doesn't communicate payment outcome, it just
 * acknowledges receipt so Safaricom stops retrying the callback.
 */
const ACK = NextResponse.json({ ResultCode: 0, ResultDesc: "Accepted" });

export async function POST(req: NextRequest) {
  let body: MpesaStkCallback;
  try {
    body = await req.json();
  } catch {
    return ACK;
  }

  const stk = body?.Body?.stkCallback;
  if (!stk?.CheckoutRequestID) {
    console.error("[mpesa-callback] malformed payload", body);
    return ACK;
  }

  const payment = await findPaymentByProviderRef("MPESA", stk.CheckoutRequestID);
  if (!payment) {
    console.error("[mpesa-callback] no payment found for CheckoutRequestID", stk.CheckoutRequestID);
    return ACK;
  }
  if (payment.status !== "PENDING") {
    // Already resolved (e.g. duplicate callback delivery) — ack and stop.
    return ACK;
  }

  if (stk.ResultCode === 0) {
    const items = stk.CallbackMetadata?.Item;
    const receiptRef = String(extractCallbackValue(items, "MpesaReceiptNumber") ?? stk.CheckoutRequestID);
    const booking = await markPaymentSuccess({ paymentId: payment.id, receiptRef, rawCallback: body as unknown });
    notifyEventBookingConfirmed(booking);
  } else {
    // Non-zero ResultCode covers user cancellation, timeout, and insufficient funds alike.
    await markPaymentFailed({ paymentId: payment.id, rawCallback: body as unknown });
  }

  return ACK;
}

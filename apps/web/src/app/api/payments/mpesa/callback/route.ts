import { NextRequest, NextResponse } from "next/server";
import {
  extractCallbackValue,
  stkQuery,
  type MpesaStkCallback,
} from "@/lib/payments/mpesa";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

/**
 * Safaricom's Daraja callback for STK Push results.
 *
 * This endpoint is public and Daraja does not sign its callbacks, so the body
 * that arrives here is untrusted input — anyone on the internet can POST one.
 * The CheckoutRequestID is no help as a shared secret either: we hand it to the
 * buyer in the booking response, so the one party with an obvious motive to
 * forge a success already holds it.
 *
 * A success claim therefore confirms nothing by itself. Before a booking is
 * marked paid we require all three of:
 *
 *   1. the CheckoutRequestID matches a PENDING payment we ourselves started;
 *   2. the amount in the callback covers what the booking is owed, so a
 *      genuine 10-shilling payment cannot settle a 10,000-shilling ticket;
 *   3. Daraja itself confirms the result, asked over an authenticated channel
 *      we opened. This is the check a forged POST cannot reach.
 *
 * Per Daraja's contract we always answer 200 with ResultCode 0. The body only
 * acknowledges receipt so Safaricom stops retrying; it does not report what we
 * decided, and a rejected callback still gets the same acknowledgement.
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
    console.error("[mpesa-callback] no payment for CheckoutRequestID", stk.CheckoutRequestID);
    return ACK;
  }
  if (payment.status !== "PENDING") {
    // Already resolved (e.g. duplicate callback delivery) — ack and stop.
    return ACK;
  }

  // A non-zero ResultCode is the customer cancelling, timing out or having
  // insufficient funds. Nobody gains by forging a failure, so we can act on it.
  if (stk.ResultCode !== 0) {
    await markPaymentFailed({ paymentId: payment.id, rawCallback: body as unknown });
    return ACK;
  }

  const items = stk.CallbackMetadata?.Item;

  // Check 2 — the amount actually paid must cover the booking.
  const paidAmount = Number(extractCallbackValue(items, "Amount") ?? NaN);
  const owed = Number(payment.amount);
  if (!Number.isFinite(paidAmount) || paidAmount < owed) {
    console.error(
      `[mpesa-callback] amount mismatch on payment ${payment.id}: claimed ${paidAmount}, owed ${owed}`
    );
    await markPaymentFailed({ paymentId: payment.id, rawCallback: body as unknown });
    return ACK;
  }

  // Check 3 — confirm with Daraja rather than believing the caller.
  try {
    const confirmed = await stkQuery(stk.CheckoutRequestID);
    if (confirmed.resultCode !== "0") {
      console.error(
        `[mpesa-callback] callback claimed success but Daraja reports ${confirmed.resultCode} ` +
          `(${confirmed.resultDesc}) for payment ${payment.id} — treating as unpaid`
      );
      await markPaymentFailed({ paymentId: payment.id, rawCallback: body as unknown });
      return ACK;
    }
  } catch (err) {
    // Daraja errors while a push is still in flight. Leaving the payment
    // PENDING is the safe outcome: no ticket is issued, and a genuine payer
    // is not marked failed on the strength of a query we could not complete.
    console.error("[mpesa-callback] could not confirm with Daraja, leaving pending:", err);
    return ACK;
  }

  const receiptRef = String(
    extractCallbackValue(items, "MpesaReceiptNumber") ?? stk.CheckoutRequestID
  );
  const booking = await markPaymentSuccess({
    paymentId: payment.id,
    receiptRef,
    rawCallback: body as unknown,
  });
  notifyEventBookingConfirmed(booking);

  return ACK;
}

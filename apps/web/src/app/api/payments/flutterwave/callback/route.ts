import { NextRequest, NextResponse } from "next/server";
import { configBaseUrl } from "@/lib/config-check";
import { verifyTransaction } from "@/lib/payments/flutterwave";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

/**
 * Where Flutterwave sends the guest's browser back after checkout. This is a
 * UX convenience, not the source of truth — the webhook above is what
 * actually confirms payment in the background — but it doubles as a second,
 * independently-verified confirmation path in case the webhook is slow or
 * (in local/dev) unreachable.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const txRef = url.searchParams.get("tx_ref");
  const transactionId = url.searchParams.get("transaction_id");
  const statusParam = url.searchParams.get("status");

  if (!txRef) {
    return NextResponse.redirect(new URL("/checkout/complete?result=error", configBaseUrl));
  }

  const payment = await findPaymentByProviderRef("FLUTTERWAVE", txRef);
  if (!payment) {
    return NextResponse.redirect(new URL("/checkout/complete?result=error", configBaseUrl));
  }

  if (payment.status === "PENDING") {
    if (statusParam === "cancelled") {
      await markPaymentFailed({ paymentId: payment.id });
    } else if (transactionId) {
      try {
        const verified = await verifyTransaction(transactionId);
        // Currency must match, not just the number. Flutterwave will happily
        // settle a transaction in another currency, and 5,000 of a weaker unit
        // is not 5,000 shillings — comparing amounts alone lets a cheap
        // currency clear an expensive ticket.
        const amountOk =
          verified.amount >= Number(payment.amount) &&
          verified.currency.toUpperCase() === payment.currency.toUpperCase();
        if (verified.status === "successful" && amountOk) {
          const booking = await markPaymentSuccess({
            paymentId: payment.id,
            receiptRef: verified.transactionId,
            rawCallback: { source: "redirect", ...verified },
          });
          notifyEventBookingConfirmed(booking);
        } else {
          await markPaymentFailed({ paymentId: payment.id, rawCallback: { source: "redirect", ...verified } });
        }
      } catch (err) {
        console.error("[flutterwave-callback] verification failed:", err);
      }
    }
  }

  const finalPayment = await findPaymentByProviderRef("FLUTTERWAVE", txRef);
  const result =
    finalPayment?.status === "SUCCESS" ? "success" : finalPayment?.status === "FAILED" ? "failed" : "pending";

  return NextResponse.redirect(
    new URL(`/checkout/complete?result=${result}&booking=${payment.bookingId}`, configBaseUrl)
  );
}

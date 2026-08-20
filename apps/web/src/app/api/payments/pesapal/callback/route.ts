import { NextRequest, NextResponse } from "next/server";
import { configBaseUrl } from "@/lib/config-check";
import { getTransactionStatus } from "@/lib/payments/pesapal";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

/**
 * Where Pesapal sends the guest's browser back after checkout. This is a UX
 * convenience, not the source of truth — the webhook is what actually
 * confirms payment in the background — but it doubles as a second,
 * independently-verified confirmation path in case the webhook is slow or
 * (in local/dev) unreachable.
 *
 * Pesapal appends PascalCase query params here (OrderTrackingId,
 * OrderMerchantReference) — different casing from the camelCase IPN webhook
 * body (orderTrackingId, orderMerchantReference). Both are Pesapal's own
 * convention, not a typo.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const orderTrackingId = url.searchParams.get("OrderTrackingId");
  const merchantReference = url.searchParams.get("OrderMerchantReference");

  if (!merchantReference) {
    return NextResponse.redirect(new URL("/checkout/complete?result=error", configBaseUrl));
  }

  const payment = await findPaymentByProviderRef("PESAPAL", merchantReference);
  if (!payment) {
    return NextResponse.redirect(new URL("/checkout/complete?result=error", configBaseUrl));
  }

  if (payment.status === "PENDING" && orderTrackingId) {
    try {
      const verified = await getTransactionStatus(orderTrackingId);
      // Currency must match, not just the number — comparing amounts alone
      // lets a cheap currency clear an expensive ticket.
      const amountOk =
        verified.amount >= Number(payment.amount) &&
        verified.currency.toUpperCase() === payment.currency.toUpperCase();
      if (verified.statusCode === 1 && amountOk) {
        const booking = await markPaymentSuccess({
          paymentId: payment.id,
          receiptRef: verified.confirmationCode || verified.orderTrackingId,
          rawCallback: { source: "redirect", ...verified },
        });
        notifyEventBookingConfirmed(booking);
      } else if (verified.statusCode === 2 || verified.statusCode === 3) {
        await markPaymentFailed({ paymentId: payment.id, rawCallback: { source: "redirect", ...verified } });
      }
      // statusCode 0 (INVALID) — Pesapal hasn't settled it yet. Leave PENDING;
      // the webhook or a later poll will catch the real outcome.
    } catch (err) {
      console.error("[pesapal-callback] verification failed:", err);
    }
  }

  const finalPayment = await findPaymentByProviderRef("PESAPAL", merchantReference);
  const result =
    finalPayment?.status === "SUCCESS" ? "success" : finalPayment?.status === "FAILED" ? "failed" : "pending";

  return NextResponse.redirect(
    new URL(`/checkout/complete?result=${result}&booking=${payment.bookingId}`, configBaseUrl)
  );
}

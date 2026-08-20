import { NextRequest, NextResponse } from "next/server";
import { getTransactionStatus, ipnAck } from "@/lib/payments/pesapal";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

/**
 * Pesapal's IPN. Unlike Flutterwave's webhook, there's no signature to check —
 * the notification body only says "something changed for this order," not
 * what changed, so every request here already has to re-verify with
 * getTransactionStatus rather than trust anything in the payload. That out-of-
 * band check is what actually protects this endpoint from a forged POST, the
 * same principle the M-Pesa callback already relies on.
 */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const orderTrackingId: string | undefined = body?.orderTrackingId;
  const merchantReference: string | undefined = body?.orderMerchantReference;
  const notificationType: string = body?.orderNotificationType ?? "IPNCHANGE";

  if (!orderTrackingId || !merchantReference) {
    return NextResponse.json({ error: "Missing tracking id or reference" }, { status: 400 });
  }

  const ack = ipnAck({
    orderNotificationType: notificationType,
    orderTrackingId,
    orderMerchantReference: merchantReference,
  });

  const payment = await findPaymentByProviderRef("PESAPAL", merchantReference);
  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json(ack);
  }

  try {
    const verified = await getTransactionStatus(orderTrackingId);
    const amountOk =
      verified.amount >= Number(payment.amount) &&
      verified.currency.toUpperCase() === payment.currency.toUpperCase();

    if (verified.statusCode === 1 && amountOk) {
      const booking = await markPaymentSuccess({
        paymentId: payment.id,
        receiptRef: verified.confirmationCode || verified.orderTrackingId,
        rawCallback: body,
      });
      notifyEventBookingConfirmed(booking);
    } else if (verified.statusCode === 2 || verified.statusCode === 3) {
      await markPaymentFailed({ paymentId: payment.id, rawCallback: body });
    }
  } catch (err) {
    console.error("[pesapal-webhook] verification failed:", err);
  }

  return NextResponse.json(ack);
}

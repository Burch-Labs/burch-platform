import { NextRequest, NextResponse } from "next/server";
import { isValidWebhookHash, verifyTransaction } from "@/lib/payments/flutterwave";
import { findPaymentByProviderRef, markPaymentFailed, markPaymentSuccess } from "@/lib/payments/ledger";
import { notifyEventBookingConfirmed } from "@/lib/payments/notify";

export async function POST(req: NextRequest) {
  if (!isValidWebhookHash(req.headers.get("verif-hash"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const body = await req.json();
  const txRef: string | undefined = body?.data?.tx_ref;
  const transactionId: string | undefined = body?.data?.id ? String(body.data.id) : undefined;

  if (!txRef || !transactionId) {
    return NextResponse.json({ received: true });
  }

  const payment = await findPaymentByProviderRef("FLUTTERWAVE", txRef);
  if (!payment || payment.status !== "PENDING") {
    return NextResponse.json({ received: true });
  }

  try {
    // Never trust the webhook body's amount/status directly — re-verify server-to-server.
    const verified = await verifyTransaction(transactionId);
    const amountOk = verified.amount >= Number(payment.amount);

    if (verified.status === "successful" && amountOk) {
      const booking = await markPaymentSuccess({
        paymentId: payment.id,
        receiptRef: verified.transactionId,
        rawCallback: body,
      });
      notifyEventBookingConfirmed(booking);
    } else {
      await markPaymentFailed({ paymentId: payment.id, rawCallback: body });
    }
  } catch (err) {
    console.error("[flutterwave-webhook] verification failed:", err);
  }

  return NextResponse.json({ received: true });
}

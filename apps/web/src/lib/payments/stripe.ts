/**
 * Stripe client — Payment intents for international cards and digital wallets.
 * Plain fetch against Stripe REST API, matching the "no SDK" convention.
 *
 * Docs: https://stripe.com/docs/payments/payment-intents
 */

const STRIPE_API = "https://api.stripe.com/v1";

export const HAS_STRIPE = !!process.env.STRIPE_SECRET_KEY;

interface CreatePaymentIntentParams {
  amount: number;
  currency: string;
  description: string;
  customerEmail: string;
  bookingId: string;
}

export async function createPaymentIntent({
  amount,
  currency,
  description,
  customerEmail,
  bookingId,
}: CreatePaymentIntentParams): Promise<{ clientSecret: string; paymentIntentId: string }> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const params = new URLSearchParams({
    amount: String(Math.round(amount * 100)), // Stripe works in cents
    currency: currency.toLowerCase(),
    description,
    receipt_email: customerEmail,
    metadata: { bookingId },
  });

  const res = await fetch(`${STRIPE_API}/payment_intents`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params.toString(),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`Stripe payment intent creation failed: ${error}`);
  }

  const data = (await res.json()) as { client_secret: string; id: string };
  return { clientSecret: data.client_secret, paymentIntentId: data.id };
}

export async function confirmPaymentIntent(paymentIntentId: string): Promise<{
  status: "succeeded" | "processing" | "requires_action" | "failed";
  amount: number;
  currency: string;
}> {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) throw new Error("Stripe is not configured");

  const auth = Buffer.from(`${secretKey}:`).toString("base64");
  const res = await fetch(`${STRIPE_API}/payment_intents/${paymentIntentId}`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) {
    throw new Error(`Stripe payment intent lookup failed: ${res.status}`);
  }

  const data = (await res.json()) as {
    status: string;
    amount: number;
    currency: string;
  };
  return {
    status: data.status as "succeeded" | "processing" | "requires_action" | "failed",
    amount: data.amount / 100,
    currency: data.currency,
  };
}

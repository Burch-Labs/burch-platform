/**
 * Flutterwave client — hosted checkout (cards + mobile money across
 * Kenya/Nigeria/Ghana/Rwanda/South Africa) via the Standard payments flow.
 * Plain fetch, matching the rest of this codebase's "no SDK" convention.
 *
 * Docs: https://developer.flutterwave.com/docs/collecting-payments/standard
 */

const FLW_API = "https://api.flutterwave.com/v3";

export const HAS_FLUTTERWAVE = !!process.env.FLUTTERWAVE_SECRET_KEY;

interface InitializePaymentParams {
  txRef: string;
  amount: number;
  currency: string;
  redirectUrl: string;
  customerEmail: string;
  customerName?: string;
  title: string;
  description: string;
}

export async function initializePayment({
  txRef,
  amount,
  currency,
  redirectUrl,
  customerEmail,
  customerName,
  title,
  description,
}: InitializePaymentParams): Promise<{ paymentLink: string }> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("Flutterwave is not configured");

  const res = await fetch(`${FLW_API}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${secretKey}`,
    },
    body: JSON.stringify({
      tx_ref: txRef,
      amount,
      currency,
      redirect_url: redirectUrl,
      customer: { email: customerEmail, name: customerName },
      customizations: { title, description },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(`Flutterwave initialize failed: ${data.message ?? res.status}`);
  }

  return { paymentLink: data.data.link as string };
}

export interface FlutterwaveVerifyResult {
  status: "successful" | "failed" | "pending" | string;
  amount: number;
  currency: string;
  txRef: string;
  transactionId: string;
}

/**
 * Always re-verify with Flutterwave directly rather than trusting the webhook
 * body or redirect query params — both can be spoofed.
 */
export async function verifyTransaction(transactionId: string): Promise<FlutterwaveVerifyResult> {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) throw new Error("Flutterwave is not configured");

  const res = await fetch(`${FLW_API}/transactions/${transactionId}/verify`, {
    headers: { Authorization: `Bearer ${secretKey}` },
  });

  const data = await res.json();
  if (!res.ok || data.status !== "success") {
    throw new Error(`Flutterwave verify failed: ${data.message ?? res.status}`);
  }

  return {
    status: data.data.status,
    amount: data.data.amount,
    currency: data.data.currency,
    txRef: data.data.tx_ref,
    transactionId: String(data.data.id),
  };
}

/** Constant-time-ish compare of the `verif-hash` header against the configured secret hash. */
export function isValidWebhookHash(receivedHash: string | null): boolean {
  const expected = process.env.FLUTTERWAVE_SECRET_HASH;
  if (!expected || !receivedHash) return false;
  if (receivedHash.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= receivedHash.charCodeAt(i) ^ expected.charCodeAt(i);
  }
  return mismatch === 0;
}

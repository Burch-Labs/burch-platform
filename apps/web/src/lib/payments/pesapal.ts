/**
 * Pesapal client — API v3, hosted checkout (cards + mobile money, Kenya-focused).
 * Plain fetch against Pesapal's REST API, matching the rest of this codebase's
 * "no SDK" convention for third-party integrations.
 *
 * Docs: https://developer.pesapal.com/how-to-integrate/e-commerce/api-30-json
 */

const PESAPAL_ENV = process.env.PESAPAL_ENV === "production" ? "production" : "sandbox";
const BASE_URL =
  PESAPAL_ENV === "production"
    ? "https://pay.pesapal.com/v3"
    : "https://cybqa.pesapal.com/pesapalv3";

/**
 * PESAPAL_IPN_ID is not something a developer copies from a dashboard field —
 * it comes back from a one-time call to registerIpn() against the exact
 * webhook URL this deployment uses. Re-register (and update the env var)
 * whenever that URL changes, e.g. moving from a preview domain to the real one.
 */
export const HAS_PESAPAL = !!(
  process.env.PESAPAL_CONSUMER_KEY &&
  process.env.PESAPAL_CONSUMER_SECRET &&
  process.env.PESAPAL_IPN_ID
);

// Access tokens are valid for only ~5 minutes (far shorter than Daraja's ~1
// hour) — cache in-memory, refresh 30s early to avoid using one that expires
// mid-request.
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const consumerKey = process.env.PESAPAL_CONSUMER_KEY;
  const consumerSecret = process.env.PESAPAL_CONSUMER_SECRET;
  if (!consumerKey || !consumerSecret) throw new Error("Pesapal is not configured");

  const res = await fetch(`${BASE_URL}/api/Auth/RequestToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ consumer_key: consumerKey, consumer_secret: consumerSecret }),
  });

  const data = await res.json();
  if (!res.ok || !data.token) {
    throw new Error(`Pesapal auth failed: ${data.message ?? res.status}`);
  }

  cachedToken = {
    value: data.token,
    expiresAt: Date.now() + 4.5 * 60 * 1000,
  };
  return cachedToken.value;
}

interface SubmitOrderParams {
  merchantReference: string;
  amount: number;
  currency: string;
  description: string;
  callbackUrl: string;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
}

export interface SubmitOrderResult {
  orderTrackingId: string;
  merchantReference: string;
  redirectUrl: string;
}

export async function submitOrder({
  merchantReference,
  amount,
  currency,
  description,
  callbackUrl,
  customerEmail,
  customerPhone,
  customerName,
}: SubmitOrderParams): Promise<SubmitOrderResult> {
  const ipnId = process.env.PESAPAL_IPN_ID;
  if (!ipnId) throw new Error("Pesapal is not configured");
  if (!customerEmail && !customerPhone) {
    throw new Error("Pesapal requires an email or phone number for billing");
  }

  const token = await getAccessToken();
  const [firstName, ...rest] = (customerName ?? "Guest").trim().split(/\s+/);

  const res = await fetch(`${BASE_URL}/api/Transactions/SubmitOrderRequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id: merchantReference,
      currency,
      amount,
      description: description.slice(0, 100),
      callback_url: callbackUrl,
      notification_id: ipnId,
      billing_address: {
        email_address: customerEmail,
        phone_number: customerPhone,
        first_name: firstName,
        last_name: rest.join(" ") || undefined,
      },
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error || !data.redirect_url) {
    throw new Error(`Pesapal submit order failed: ${data.error?.message ?? data.message ?? res.status}`);
  }

  return {
    orderTrackingId: data.order_tracking_id,
    merchantReference: data.merchant_reference,
    redirectUrl: data.redirect_url,
  };
}

export interface PesapalTransactionStatus {
  /** 0 = INVALID, 1 = COMPLETED, 2 = FAILED, 3 = REVERSED */
  statusCode: number;
  statusDescription: string;
  amount: number;
  currency: string;
  merchantReference: string;
  confirmationCode: string;
  orderTrackingId: string;
}

/**
 * Always re-verify with Pesapal directly rather than trusting the IPN body or
 * redirect query params — both can be spoofed. Mirrors the same principle the
 * M-Pesa and (former) Flutterwave integrations already followed here.
 */
export async function getTransactionStatus(orderTrackingId: string): Promise<PesapalTransactionStatus> {
  const token = await getAccessToken();
  const res = await fetch(
    `${BASE_URL}/api/Transactions/GetTransactionStatus?orderTrackingId=${encodeURIComponent(orderTrackingId)}`,
    { headers: { Accept: "application/json", Authorization: `Bearer ${token}` } }
  );

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(`Pesapal status check failed: ${data.error?.message ?? res.status}`);
  }

  return {
    statusCode: Number(data.status_code),
    statusDescription: String(data.payment_status_description ?? ""),
    amount: Number(data.amount),
    currency: String(data.currency ?? ""),
    merchantReference: String(data.merchant_reference ?? ""),
    confirmationCode: String(data.confirmation_code ?? ""),
    orderTrackingId,
  };
}

/**
 * One-time setup, not called per-transaction: registers a callback URL with
 * Pesapal and returns the ipn_id to store as PESAPAL_IPN_ID.
 */
export async function registerIpn(url: string): Promise<{ ipnId: string }> {
  const token = await getAccessToken();
  const res = await fetch(`${BASE_URL}/api/URLSetup/RegisterIPN`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ url, ipn_notification_type: "POST" }),
  });

  const data = await res.json();
  if (!res.ok || data.error || !data.ipn_id) {
    throw new Error(`Pesapal IPN registration failed: ${data.error?.message ?? res.status}`);
  }

  return { ipnId: data.ipn_id };
}

export interface PesapalIpnPayload {
  orderNotificationType: string;
  orderTrackingId: string;
  orderMerchantReference: string;
}

/**
 * Pesapal requires this exact shape echoed back from an IPN POST — anything
 * else and it keeps retrying the notification.
 */
export function ipnAck(payload: PesapalIpnPayload) {
  return {
    orderNotificationType: payload.orderNotificationType,
    orderTrackingId: payload.orderTrackingId,
    orderMerchantReference: payload.orderMerchantReference,
    status: 200,
  };
}

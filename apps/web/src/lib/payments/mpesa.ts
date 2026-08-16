/**
 * M-Pesa Daraja client — STK Push (Lipa Na M-Pesa Online).
 * Plain fetch against Safaricom's REST API, matching the rest of this
 * codebase's "no SDK" convention for third-party integrations.
 *
 * Docs: https://developer.safaricom.co.ke/APIs/MpesaExpressSimulate
 */

const MPESA_ENV = process.env.MPESA_ENV === "production" ? "production" : "sandbox";
const BASE_URL =
  MPESA_ENV === "production"
    ? "https://api.safaricom.co.ke"
    : "https://sandbox.safaricom.co.ke";

export const HAS_MPESA = !!(
  process.env.MPESA_CONSUMER_KEY &&
  process.env.MPESA_CONSUMER_SECRET &&
  process.env.MPESA_PASSKEY &&
  process.env.MPESA_SHORTCODE
);

// Access tokens are valid for ~1 hour; cache in-memory to avoid hitting the
// OAuth endpoint on every STK push (Daraja rate-limits it).
let cachedToken: { value: string; expiresAt: number } | null = null;

async function getAccessToken(): Promise<string> {
  if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

  const key = process.env.MPESA_CONSUMER_KEY;
  const secret = process.env.MPESA_CONSUMER_SECRET;
  if (!key || !secret) throw new Error("M-Pesa is not configured");

  const auth = Buffer.from(`${key}:${secret}`).toString("base64");
  const res = await fetch(`${BASE_URL}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: { Authorization: `Basic ${auth}` },
  });

  if (!res.ok) throw new Error(`M-Pesa OAuth failed: ${res.status} ${await res.text()}`);
  const data = (await res.json()) as { access_token: string; expires_in: string };

  cachedToken = {
    value: data.access_token,
    // Refresh a minute early to avoid using a token that expires mid-request.
    expiresAt: Date.now() + (Number(data.expires_in) - 60) * 1000,
  };
  return cachedToken.value;
}

function timestamp(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    d.getFullYear().toString() +
    pad(d.getMonth() + 1) +
    pad(d.getDate()) +
    pad(d.getHours()) +
    pad(d.getMinutes()) +
    pad(d.getSeconds())
  );
}

/**
 * Normalizes a Kenyan phone number to Daraja's expected MSISDN format:
 * 2547XXXXXXXX / 2541XXXXXXXX (no leading +, no leading 0).
 */
export function normalizeMsisdn(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("254")) return digits;
  if (digits.startsWith("0")) return `254${digits.slice(1)}`;
  if (digits.startsWith("7") || digits.startsWith("1")) return `254${digits}`;
  return digits;
}

export function isValidMsisdn(phone: string): boolean {
  return /^254(7|1)\d{8}$/.test(normalizeMsisdn(phone));
}

interface StkPushParams {
  phone: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl: string;
}

export interface StkPushResult {
  merchantRequestId: string;
  checkoutRequestId: string;
  responseCode: string;
  customerMessage: string;
}

export async function stkPush({
  phone,
  amount,
  accountReference,
  transactionDesc,
  callbackUrl,
}: StkPushParams): Promise<StkPushResult> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) throw new Error("M-Pesa is not configured");

  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");
  const msisdn = normalizeMsisdn(phone);

  const res = await fetch(`${BASE_URL}/mpesa/stkpush/v1/processrequest`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      TransactionType: "CustomerPayBillOnline",
      Amount: Math.round(amount),
      PartyA: msisdn,
      PartyB: shortcode,
      PhoneNumber: msisdn,
      CallBackURL: callbackUrl,
      AccountReference: accountReference.slice(0, 12),
      TransactionDesc: transactionDesc.slice(0, 13),
    }),
  });

  const data = await res.json();
  if (!res.ok || data.ResponseCode !== "0") {
    throw new Error(`M-Pesa STK push failed: ${data.errorMessage ?? data.ResponseDescription ?? res.status}`);
  }

  return {
    merchantRequestId: data.MerchantRequestID,
    checkoutRequestId: data.CheckoutRequestID,
    responseCode: data.ResponseCode,
    customerMessage: data.CustomerMessage,
  };
}

export interface StkQueryResult {
  /** "0" when the customer completed payment; any other code means they did not. */
  resultCode: string;
  resultDesc: string;
}

/**
 * Ask Daraja directly what happened to an STK push.
 *
 * Daraja does not sign its callbacks, and the callback endpoint has to stay
 * publicly reachable for Safaricom to hit it. That combination means a POST
 * claiming success proves nothing on its own — anyone can send one. This query
 * is the out-of-band check: we ask Safaricom over an authenticated channel we
 * opened ourselves, so a forged callback cannot influence the answer.
 *
 * Treat a throw as "unknown", never as failure — Daraja returns an error while
 * a push is still being processed, and marking a real payment failed because a
 * query came back early would lose a paying customer their ticket.
 */
export async function stkQuery(checkoutRequestId: string): Promise<StkQueryResult> {
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  if (!shortcode || !passkey) throw new Error("M-Pesa is not configured");

  const token = await getAccessToken();
  const ts = timestamp();
  const password = Buffer.from(`${shortcode}${passkey}${ts}`).toString("base64");

  const res = await fetch(`${BASE_URL}/mpesa/stkpushquery/v1/query`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      BusinessShortCode: shortcode,
      Password: password,
      Timestamp: ts,
      CheckoutRequestID: checkoutRequestId,
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(`M-Pesa STK query failed: ${data.errorMessage ?? res.status}`);
  }
  return {
    resultCode: String(data.ResultCode ?? ""),
    resultDesc: String(data.ResultDesc ?? ""),
  };
}

// ─── Callback payload shape ───────────────────────────────────────────────────

export interface MpesaCallbackMetadataItem {
  Name: string;
  Value?: string | number;
}

export interface MpesaStkCallback {
  Body: {
    stkCallback: {
      MerchantRequestID: string;
      CheckoutRequestID: string;
      ResultCode: number;
      ResultDesc: string;
      CallbackMetadata?: { Item: MpesaCallbackMetadataItem[] };
    };
  };
}

export function extractCallbackValue(
  items: MpesaCallbackMetadataItem[] | undefined,
  name: string
): string | number | undefined {
  return items?.find((i) => i.Name === name)?.Value;
}

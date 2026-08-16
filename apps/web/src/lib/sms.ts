/**
 * SMS delivery.
 *
 * Sign-in codes go by email today because that is the channel we can actually
 * send on. In Kenya that is the wrong default — a phone number is the identifier
 * most people give first, and an SMS arrives while an email may not be checked
 * for hours. So the code below is written as a provider interface with an
 * Africa's Talking implementation that switches itself on the moment credentials
 * exist, rather than as a rewrite waiting to happen.
 *
 * With no credentials configured, `sendSms` logs in development and reports
 * failure in production. It never throws: a failed SMS must fall back to email
 * rather than take a sign-in attempt down with it.
 */

export const HAS_SMS = !!(
  process.env.AFRICASTALKING_API_KEY && process.env.AFRICASTALKING_USERNAME
);

export type SmsResult =
  | { sent: true; provider: "africastalking" }
  | { sent: false; reason: "not-configured" | "invalid-number" | "provider-error" };

/**
 * Normalises to the E.164 form Africa's Talking expects (+2547XXXXXXXX).
 *
 * Kept here rather than reused from the M-Pesa helper because the two want
 * different shapes — Daraja wants 2547… with no plus, this wants the plus — and
 * quietly sharing one would eventually send a malformed number to one of them.
 */
export function toE164(phone: string): string | null {
  const digits = phone.replace(/\D/g, "");
  let msisdn: string;
  if (digits.startsWith("254")) msisdn = digits;
  else if (digits.startsWith("0")) msisdn = `254${digits.slice(1)}`;
  else if (digits.startsWith("7") || digits.startsWith("1")) msisdn = `254${digits}`;
  else return null;

  return /^254(7|1)\d{8}$/.test(msisdn) ? `+${msisdn}` : null;
}

/**
 * Sends one message. Returns rather than throws — see the module note.
 */
export async function sendSms(to: string, message: string): Promise<SmsResult> {
  const recipient = toE164(to);
  if (!recipient) return { sent: false, reason: "invalid-number" };

  if (!HAS_SMS) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n" + "─".repeat(60));
      console.log(`📱  [SMS — DEV MODE] to ${recipient}`);
      console.log(`    ${message}`);
      console.log("─".repeat(60) + "\n");
    }
    return { sent: false, reason: "not-configured" };
  }

  const username = process.env.AFRICASTALKING_USERNAME!;
  const apiKey = process.env.AFRICASTALKING_API_KEY!;
  // Sandbox and live are different hosts; the username "sandbox" is how
  // Africa's Talking itself distinguishes them.
  const host =
    username === "sandbox"
      ? "https://api.sandbox.africastalking.com"
      : "https://api.africastalking.com";

  try {
    const body = new URLSearchParams({ username, to: recipient, message });
    if (process.env.AFRICASTALKING_SENDER_ID) {
      body.set("from", process.env.AFRICASTALKING_SENDER_ID);
    }

    const res = await fetch(`${host}/version1/messaging`, {
      method: "POST",
      headers: {
        apiKey,
        "Content-Type": "application/x-www-form-urlencoded",
        Accept: "application/json",
      },
      body,
    });

    if (!res.ok) {
      console.error(`[sms] Africa's Talking returned ${res.status}: ${await res.text()}`);
      return { sent: false, reason: "provider-error" };
    }

    const data = await res.json();
    const recipients = data?.SMSMessageData?.Recipients ?? [];
    // A 200 does not mean delivered — per-recipient status carries the truth,
    // and a rejected number comes back inside an otherwise successful response.
    const ok = recipients.some(
      (r: { status?: string }) => r.status === "Success"
    );
    if (!ok) {
      console.error("[sms] no recipient accepted:", JSON.stringify(data?.SMSMessageData ?? data));
      return { sent: false, reason: "provider-error" };
    }

    return { sent: true, provider: "africastalking" };
  } catch (err) {
    console.error("[sms] send failed:", err);
    return { sent: false, reason: "provider-error" };
  }
}

/** The sign-in code message. Short, because an SMS is charged per segment. */
export function signInCodeSms(code: string, ttlMinutes: number): string {
  return `${code} is your dontbeboring sign-in code. It expires in ${ttlMinutes} minutes. Do not share it.`;
}

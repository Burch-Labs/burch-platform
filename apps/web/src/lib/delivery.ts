/**
 * How a sign-in code reaches its owner.
 *
 * The load-bearing rule in this file: **the identifier is the destination.**
 * You sign in with an email and the code goes to that email, or you sign in
 * with a phone and it goes to that phone. The two are never crossed.
 *
 * That is not a stylistic choice. Let a caller name one account and a different
 * destination — "send victim@example.com's code to my handset" — and you have
 * handed anyone a one-step account takeover, because the code that opens an
 * account arrives on a device its owner does not hold. Every function here
 * derives the destination from the identifier rather than accepting one.
 *
 * The channel is still the user's to pick, because email, SMS and WhatsApp are
 * three ways of reaching *the same* identifier. Choosing WhatsApp for a phone
 * identifier changes the route, never the recipient.
 */
import { HAS_SMS, sendSms, signInCodeSms, toE164 } from "@/lib/sms";
import { HAS_WHATSAPP, sendWhatsAppCode } from "@/lib/whatsapp";
import { sendSignInCodeEmail } from "@/lib/email";

export type Channel = "email" | "sms" | "whatsapp";

export type Identifier =
  | { kind: "email"; value: string }
  | { kind: "phone"; value: string };

/**
 * Works out whether the user typed an email or a Kenyan phone number, and
 * normalises it. One input box, no radio buttons — people know which of their
 * own contact details they are typing.
 */
export function parseIdentifier(raw: string): Identifier | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (trimmed.includes("@")) {
    const email = trimmed.toLowerCase();
    // Deliberately loose: real addresses defeat strict patterns, and a wrong
    // guess here locks someone out of their own account.
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? { kind: "email", value: email } : null;
  }

  const phone = toE164(trimmed);
  return phone ? { kind: "phone", value: phone } : null;
}

/**
 * Channels that can carry a code to this identifier, given what is configured.
 *
 * Outside production, phone channels count as available even with no provider
 * credentials, because both senders log the code to the console in that mode.
 * Without this, signing in by phone would be untestable locally — the route
 * would 503 before it ever reached the logger, and the whole phone path would
 * only ever be exercised for the first time in production.
 */
export function channelsFor(identifier: Identifier): Channel[] {
  if (identifier.kind === "email") return ["email"];

  const devFallback = process.env.NODE_ENV !== "production";

  const channels: Channel[] = [];
  if (HAS_WHATSAPP || devFallback) channels.push("whatsapp");
  if (HAS_SMS || devFallback) channels.push("sms");
  return channels;
}

/**
 * Picks the channel to actually use.
 *
 * Honours a preference when that channel can reach this identifier, and falls
 * back to whatever can. Never falls back to a *different recipient* — if
 * nothing can reach a phone identifier, the answer is no channel rather than
 * "we emailed it to someone".
 */
export function resolveChannel(
  identifier: Identifier,
  preferred?: Channel
): Channel | null {
  const available = channelsFor(identifier);
  if (available.length === 0) return null;
  if (preferred && available.includes(preferred)) return preferred;
  // WhatsApp first for phone identifiers: in this market it is the channel
  // people actually watch, and it costs less than SMS per message.
  return available[0];
}

export type DeliveryOutcome =
  | { delivered: true; channel: Channel }
  | { delivered: false; reason: "no-channel" | "send-failed" };

/**
 * Sends the code. The destination comes from the identifier, never a parameter.
 */
export async function deliverSignInCode(params: {
  identifier: Identifier;
  code: string;
  ttlMinutes: number;
  preferredChannel?: Channel;
}): Promise<DeliveryOutcome> {
  const channel = resolveChannel(params.identifier, params.preferredChannel);
  if (!channel) return { delivered: false, reason: "no-channel" };

  try {
    if (channel === "email") {
      await sendSignInCodeEmail(params.identifier.value, params.code, params.ttlMinutes);
      return { delivered: true, channel };
    }

    if (channel === "whatsapp") {
      const result = await sendWhatsAppCode(params.identifier.value, params.code);
      if (result.sent) return { delivered: true, channel };
      // Unconfigured in development means the code went to the console, which
      // counts as delivered for a developer sitting in front of it.
      if (result.reason === "not-configured" && process.env.NODE_ENV !== "production") {
        return { delivered: true, channel };
      }
      // A WhatsApp failure may still be rescuable by SMS — same number, same
      // person, different pipe.
      if (HAS_SMS) {
        const sms = await sendSms(
          params.identifier.value,
          signInCodeSms(params.code, params.ttlMinutes)
        );
        if (sms.sent) return { delivered: true, channel: "sms" };
      }
      return { delivered: false, reason: "send-failed" };
    }

    const sms = await sendSms(
      params.identifier.value,
      signInCodeSms(params.code, params.ttlMinutes)
    );
    if (sms.sent) return { delivered: true, channel: "sms" };
    if (sms.reason === "not-configured" && process.env.NODE_ENV !== "production") {
      return { delivered: true, channel: "sms" };
    }
    return { delivered: false, reason: "send-failed" };
  } catch (err) {
    console.error("[delivery] sign-in code delivery failed:", err);
    return { delivered: false, reason: "send-failed" };
  }
}

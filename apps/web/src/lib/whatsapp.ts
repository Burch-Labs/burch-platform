/**
 * WhatsApp sign-in codes, via Meta's Cloud API.
 *
 * WhatsApp does not let you send an arbitrary message containing a code. A
 * verification code must go through an approved **authentication template**
 * carrying an OTP button — Meta rejects codes sent as ordinary or marketing
 * messages. That means this cannot be switched on by pasting in a token: the
 * template has to be created and approved in Meta's Business Manager first, and
 * `WHATSAPP_OTP_TEMPLATE` then names it.
 *
 * The shape of an authentication template is fixed by Meta, which is why the
 * request below looks odd — the same code goes in twice, once as the body
 * parameter that renders in the message and once as the button parameter that
 * makes "copy code" work. That is their contract, not a mistake.
 *
 * Like SMS this returns rather than throws: a WhatsApp outage must degrade to
 * another channel, not take sign-in down.
 */
import { toE164 } from "@/lib/sms";

const GRAPH_VERSION = "v21.0";

export const HAS_WHATSAPP = !!(
  process.env.WHATSAPP_ACCESS_TOKEN &&
  process.env.WHATSAPP_PHONE_NUMBER_ID &&
  process.env.WHATSAPP_OTP_TEMPLATE
);

export type WhatsAppResult =
  | { sent: true }
  | { sent: false; reason: "not-configured" | "invalid-number" | "provider-error" };

export async function sendWhatsAppCode(
  to: string,
  code: string
): Promise<WhatsAppResult> {
  const recipient = toE164(to);
  if (!recipient) return { sent: false, reason: "invalid-number" };

  if (!HAS_WHATSAPP) {
    if (process.env.NODE_ENV !== "production") {
      console.log("\n" + "─".repeat(60));
      console.log(`💬  [WHATSAPP — DEV MODE] to ${recipient}`);
      console.log(`    sign-in code: ${code}`);
      console.log("─".repeat(60) + "\n");
    }
    return { sent: false, reason: "not-configured" };
  }

  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID!;
  const template = process.env.WHATSAPP_OTP_TEMPLATE!;
  const language = process.env.WHATSAPP_OTP_TEMPLATE_LANG ?? "en";

  try {
    const res = await fetch(
      `https://graph.facebook.com/${GRAPH_VERSION}/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          // Meta wants the number without the leading plus.
          to: recipient.replace(/^\+/, ""),
          type: "template",
          template: {
            name: template,
            language: { code: language },
            components: [
              // The code as it appears in the message body.
              { type: "body", parameters: [{ type: "text", text: code }] },
              // And again on the button, which is what makes it copyable.
              {
                type: "button",
                sub_type: "url",
                index: "0",
                parameters: [{ type: "text", text: code }],
              },
            ],
          },
        }),
      }
    );

    if (!res.ok) {
      const detail = await res.text();
      console.error(`[whatsapp] Cloud API returned ${res.status}: ${detail}`);
      return { sent: false, reason: "provider-error" };
    }

    const data = await res.json();
    if (!data?.messages?.length) {
      console.error("[whatsapp] accepted but no message queued:", JSON.stringify(data));
      return { sent: false, reason: "provider-error" };
    }
    return { sent: true };
  } catch (err) {
    console.error("[whatsapp] send failed:", err);
    return { sent: false, reason: "provider-error" };
  }
}

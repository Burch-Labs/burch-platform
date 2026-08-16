import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestSignInCode, SIGN_IN_CODE_POLICY } from "@/lib/signin-codes";
import { sendSignInCodeEmail } from "@/lib/email";
import { HAS_SMS, sendSms, signInCodeSms, toE164 } from "@/lib/sms";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
  /** Optional. When given and SMS is configured, the code goes to the phone too. */
  phone: z.string().trim().optional(),
});

/**
 * Issues a sign-in code and delivers it.
 *
 * The response is identical whether or not an account exists, and identical
 * whether or not delivery succeeded. That is on purpose: a different response,
 * or even a noticeably different latency, would turn this into a way to test
 * which addresses have accounts here.
 *
 * Rate limiting is the one exception — a 429 is worth telling the caller about,
 * because the alternative is a user retrying into a wall with no explanation.
 * It leaks only that *this* address has asked recently, which the asker
 * already knows.
 *
 * Delivery goes to both channels when a phone is supplied and SMS is live. Both
 * carry the same code, so whichever arrives first is the one they use — in this
 * market that is usually the SMS, but an unreachable handset should not strand
 * someone who can still reach their inbox.
 */
export async function POST(req: NextRequest) {
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const issued = await requestSignInCode(input.email);

  if (!issued.ok) {
    return NextResponse.json(
      { error: `Too many codes requested. Try again in ${issued.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  const ttl = SIGN_IN_CODE_POLICY.TTL_MINUTES;

  // Failures are logged, never surfaced. Telling the caller which channel
  // failed would let them probe whether an address or number is real.
  const deliveries: Promise<unknown>[] = [
    sendSignInCodeEmail(input.email, issued.code, ttl).catch((err) =>
      console.error("[request-code] email delivery failed:", err)
    ),
  ];

  const phone = input.phone ? toE164(input.phone) : null;
  if (phone && HAS_SMS) {
    deliveries.push(
      sendSms(phone, signInCodeSms(issued.code, ttl)).then((result) => {
        if (!result.sent) console.error(`[request-code] sms not delivered: ${result.reason}`);
      })
    );
  }

  await Promise.all(deliveries);

  return NextResponse.json({
    sent: true,
    expiresInMinutes: ttl,
    // Lets the UI say "check your phone" honestly rather than guessing. Safe to
    // return: it reflects our own configuration, not anything about the user.
    channels: phone && HAS_SMS ? ["email", "sms"] : ["email"],
  });
}

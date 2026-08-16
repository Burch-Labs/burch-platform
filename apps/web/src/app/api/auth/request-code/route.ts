import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestSignInCode, SIGN_IN_CODE_POLICY } from "@/lib/signin-codes";
import { channelsFor, deliverSignInCode, parseIdentifier, type Channel } from "@/lib/delivery";

const schema = z.object({
  /** An email address or a Kenyan phone number. Named loosely because it is
      whichever the user chose to sign in with. */
  identifier: z.string().min(3),
  channel: z.enum(["email", "sms", "whatsapp"]).optional(),
});

/**
 * Issues a sign-in code and delivers it to the identifier that was given.
 *
 * The caller picks a channel but never a recipient. Accepting a destination
 * separate from the account would let anyone have someone else's code sent to
 * their own handset, which is a one-step account takeover — so the destination
 * is derived from the identifier inside lib/delivery and cannot be overridden
 * from here.
 *
 * The response is otherwise identical whether or not an account exists, and
 * whether or not delivery succeeded, so this cannot be used to test which
 * addresses or numbers are registered. Rate limiting is the one exception: a
 * 429 leaks only that this identifier asked recently, which the asker knows.
 */
export async function POST(req: NextRequest) {
  let input: z.infer<typeof schema>;
  try {
    input = schema.parse(await req.json());
  } catch {
    return NextResponse.json(
      { error: "Enter your email address or phone number." },
      { status: 400 }
    );
  }

  const identifier = parseIdentifier(input.identifier);
  if (!identifier) {
    return NextResponse.json(
      { error: "That does not look like an email address or a Kenyan phone number." },
      { status: 400 }
    );
  }

  const available = channelsFor(identifier);
  if (available.length === 0) {
    // A phone identifier with neither WhatsApp nor SMS configured. Say so
    // plainly rather than accepting the request and silently sending nothing.
    return NextResponse.json(
      { error: "We cannot send codes to a phone yet. Use your email address instead." },
      { status: 503 }
    );
  }

  const issued = await requestSignInCode(identifier.value);
  if (!issued.ok) {
    return NextResponse.json(
      { error: `Too many codes requested. Try again in ${issued.retryAfterMinutes} minutes.` },
      { status: 429 }
    );
  }

  const outcome = await deliverSignInCode({
    identifier,
    code: issued.code,
    ttlMinutes: SIGN_IN_CODE_POLICY.TTL_MINUTES,
    preferredChannel: input.channel as Channel | undefined,
  });

  if (!outcome.delivered) {
    // Logged only. Reporting a delivery failure would distinguish a reachable
    // address from an unreachable one.
    console.error(`[request-code] delivery failed: ${outcome.reason}`);
  }

  return NextResponse.json({
    sent: true,
    expiresInMinutes: SIGN_IN_CODE_POLICY.TTL_MINUTES,
    // Where it went, so the UI can say "check WhatsApp" honestly. Reflects our
    // configuration and the identifier the caller supplied — nothing they did
    // not already know.
    channel: outcome.delivered ? outcome.channel : available[0],
    availableChannels: available,
  });
}

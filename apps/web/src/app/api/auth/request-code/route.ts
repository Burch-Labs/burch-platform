import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requestSignInCode, SIGN_IN_CODE_POLICY } from "@/lib/signin-codes";
import { sendSignInCodeEmail } from "@/lib/email";

const schema = z.object({
  email: z.string().email("Enter a valid email address."),
});

/**
 * Issues a sign-in code and emails it.
 *
 * The response is identical whether or not an account exists, and identical
 * whether or not the send succeeded. That is on purpose: a different response,
 * or even a noticeably different latency, would turn this into a way to test
 * which addresses have accounts here.
 *
 * Rate limiting is the one exception — a 429 is worth telling the caller about,
 * because the alternative is a user retrying into a wall with no explanation.
 * It leaks only that *this* address has asked recently, which the asker
 * already knows.
 */
export async function POST(req: NextRequest) {
  let email: string;
  try {
    ({ email } = schema.parse(await req.json()));
  } catch {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 });
  }

  const issued = await requestSignInCode(email);

  if (!issued.ok) {
    return NextResponse.json(
      {
        error: `Too many codes requested. Try again in ${issued.retryAfterMinutes} minutes.`,
      },
      { status: 429 }
    );
  }

  try {
    await sendSignInCodeEmail(email, issued.code, SIGN_IN_CODE_POLICY.TTL_MINUTES);
  } catch (err) {
    // Logged, not surfaced. Telling the caller the send failed would let them
    // distinguish a deliverable address from an undeliverable one.
    console.error("[request-code] could not send sign-in code:", err);
  }

  return NextResponse.json({
    sent: true,
    expiresInMinutes: SIGN_IN_CODE_POLICY.TTL_MINUTES,
  });
}

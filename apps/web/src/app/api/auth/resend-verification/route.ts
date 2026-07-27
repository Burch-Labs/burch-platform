import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

// In-memory rate limit store: email → timestamp of last send
// One request per email per RATE_LIMIT_MS
const RATE_LIMIT_MS = 60_000; // 1 minute
const lastSentAt = new Map<string, number>();

// Periodically prune stale entries so the Map doesn't grow unboundedly
setInterval(() => {
  const cutoff = Date.now() - RATE_LIMIT_MS * 10;
  for (const [key, ts] of lastSentAt) {
    if (ts < cutoff) lastSentAt.delete(key);
  }
}, RATE_LIMIT_MS * 10);

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    // Rate limit check
    const last = lastSentAt.get(email);
    if (last !== undefined) {
      const elapsed = Date.now() - last;
      if (elapsed < RATE_LIMIT_MS) {
        const retryAfter = Math.ceil((RATE_LIMIT_MS - elapsed) / 1000);
        return NextResponse.json(
          { error: `Please wait ${retryAfter} second${retryAfter === 1 ? "" : "s"} before requesting another email.`, retryAfter },
          { status: 429 }
        );
      }
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Avoid enumeration — record rate limit and return success
      lastSentAt.set(email, Date.now());
      return NextResponse.json({ message: "Verification email sent." });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    const token = await createEmailVerificationToken(email);
    await sendVerificationEmail(email, token);

    // Record send time only after a successful send
    lastSentAt.set(email, Date.now());

    return NextResponse.json({ message: "Verification email sent." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    console.error("[resend-verification]", err);
    return NextResponse.json(
      { error: "Failed to send verification email. Please try again in a moment." },
      { status: 500 }
    );
  }
}

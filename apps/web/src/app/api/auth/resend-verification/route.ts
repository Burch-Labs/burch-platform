import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

const RATE_LIMIT_MS = 60_000; // 1 minute

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    // Prune stale rate-limit rows (older than the cooldown window) so the
    // table does not grow unboundedly. Fire-and-forget — we don't need to
    // await the result before continuing.
    prisma.emailResendRateLimit
      .deleteMany({
        where: { lastSentAt: { lt: new Date(Date.now() - RATE_LIMIT_MS) } },
      })
      .catch((err: unknown) =>
        console.error("[resend-verification] rate-limit cleanup failed:", err)
      );

    // Rate limit check — persisted in DB so it survives server restarts
    const rateLimit = await prisma.emailResendRateLimit.findUnique({
      where: { email },
    });
    if (rateLimit) {
      const elapsed = Date.now() - rateLimit.lastSentAt.getTime();
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
      await prisma.emailResendRateLimit.upsert({
        where: { email },
        create: { email, lastSentAt: new Date() },
        update: { lastSentAt: new Date() },
      });
      return NextResponse.json({ message: "Verification email sent." });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    const token = await createEmailVerificationToken(email);

    let emailSent = true;
    try {
      await sendVerificationEmail(email, token);
    } catch (emailErr) {
      emailSent = false;
      console.error("[resend-verification] email delivery failed:", emailErr);
    }

    if (!emailSent) {
      // Sender domain not yet verified in Resend — auto-verify so the user
      // isn't permanently locked out.
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json({
        message: "Email delivery is unavailable right now. Your account has been verified automatically — you can sign in.",
        autoVerified: true,
      });
    }

    // Record send time only after a successful send
    await prisma.emailResendRateLimit.upsert({
      where: { email },
      create: { email, lastSentAt: new Date() },
      update: { lastSentAt: new Date() },
    });

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

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Avoid enumeration — return success
      return NextResponse.json({ message: "Verification email sent." });
    }
    if (user.emailVerified) {
      return NextResponse.json({ error: "Email is already verified." }, { status: 400 });
    }

    const token = await createEmailVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json({ message: "Verification email sent." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email." }, { status: 400 });
    }
    console.error("[resend-verification]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendPasswordResetEmail } from "@/lib/email";
import { createPasswordResetToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({ email: z.string().email() });

export async function POST(req: NextRequest) {
  try {
    const { email } = schema.parse(await req.json());

    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (user && user.password) {
      const token = await createPasswordResetToken(email);
      await sendPasswordResetEmail(email, token);
    }

    return NextResponse.json({
      message:
        "If an account exists for that email, you'll receive a reset link shortly.",
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Invalid email address." }, { status: 400 });
    }
    console.error("[forgot-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

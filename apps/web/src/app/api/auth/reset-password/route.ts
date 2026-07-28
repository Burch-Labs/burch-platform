import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { validatePasswordResetToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json());

    const result = await validatePasswordResetToken(token);
    if (!result) {
      return NextResponse.json(
        { error: "Reset link is invalid or has already been used." },
        { status: 400 }
      );
    }
    if (result.expired) {
      return NextResponse.json(
        { error: "Reset link has expired. Please request a new one." },
        { status: 400 }
      );
    }

    const hashed = await hash(password, 12);
    await prisma.user.update({
      where: { email: result.email },
      data: { password: hashed },
    });

    return NextResponse.json({ message: "Password updated successfully." });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[reset-password]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

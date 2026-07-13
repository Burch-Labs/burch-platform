import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/tokens";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["CUSTOMER", "PARTNER"]).default("CUSTOMER"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, password, role } = schema.parse(body);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const hashed = await hash(password, 12);
    await prisma.user.create({
      data: { name, email, password: hashed, role },
    });

    // Send verification email
    const token = await createEmailVerificationToken(email);
    await sendVerificationEmail(email, token);

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account." },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0].message },
        { status: 400 }
      );
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

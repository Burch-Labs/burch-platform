import { NextRequest, NextResponse } from "next/server";
import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, HAS_RESEND } from "@/lib/email";
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

    if (!HAS_RESEND) {
      // No email service — auto-verify so users can log in immediately
      await prisma.user.create({
        data: { name, email, password: hashed, role, emailVerified: new Date() },
      });
      return NextResponse.json(
        { message: "Account created successfully. You can now sign in.", autoVerified: true },
        { status: 201 }
      );
    }

    // Email service available — require verification
    await prisma.user.create({ data: { name, email, password: hashed, role } });
    const token = await createEmailVerificationToken(email);

    let emailSent = true;
    try {
      await sendVerificationEmail(email, token);
    } catch (emailErr) {
      emailSent = false;
      console.error("[register] Failed to send verification email:", emailErr);
    }

    if (!emailSent) {
      // Email delivery failed (e.g. unverified sender domain) — auto-verify so
      // the user isn't locked out of an account they just created.
      await prisma.user.update({
        where: { email },
        data: { emailVerified: new Date() },
      });
      return NextResponse.json(
        {
          message: "Account created successfully. You can now sign in.",
          autoVerified: true,
          emailFailed: true,
        },
        { status: 201 }
      );
    }

    return NextResponse.json(
      { message: "Account created. Please check your email to verify your account.", autoVerified: false },
      { status: 201 }
    );
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[register]", err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}

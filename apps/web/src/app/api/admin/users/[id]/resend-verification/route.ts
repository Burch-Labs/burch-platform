import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendVerificationEmail, HAS_RESEND } from "@/lib/email";
import { createEmailVerificationToken } from "@/lib/tokens";
import { isAdminRole } from "@/lib/roles";

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.emailVerified) {
    return NextResponse.json({ error: "Already verified" }, { status: 400 });
  }

  if (!HAS_RESEND) {
    return NextResponse.json(
      { error: "Email service is not configured (RESEND_API_KEY missing)." },
      { status: 503 }
    );
  }

  const token = await createEmailVerificationToken(user.email);
  await sendVerificationEmail(user.email, token);

  return NextResponse.json({ message: "Verification email sent." });
}

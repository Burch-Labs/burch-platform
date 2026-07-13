import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateEmailVerificationToken,
  deleteEmailVerificationToken,
} from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  const result = await validateEmailVerificationToken(token);
  if (!result) {
    return NextResponse.json(
      { error: "Token is invalid or has expired." },
      { status: 400 }
    );
  }

  await prisma.user.update({
    where: { email: result.email },
    data: { emailVerified: new Date() },
  });

  await deleteEmailVerificationToken(token);

  return NextResponse.redirect(
    new URL("/auth/login?verified=1", req.url)
  );
}

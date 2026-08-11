import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  validateEmailVerificationToken,
  pruneExpiredEmailVerificationTokens,
} from "@/lib/tokens";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");

  if (!token) {
    return NextResponse.json({ error: "Missing token." }, { status: 400 });
  }

  // validateEmailVerificationToken atomically deletes the token on first use,
  // so a replayed link is always rejected.
  const result = await validateEmailVerificationToken(token);

  // Opportunistically prune expired tokens so stale rows never build up.
  // Fire-and-forget — errors are logged inside the helper. This runs AFTER
  // validation has consumed/classified the submitted token, so pruning can
  // never race it into being misreported as "invalid" instead of "expired".
  pruneExpiredEmailVerificationTokens();

  if (!result) {
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=invalid", req.url)
    );
  }

  if (result.expired) {
    return NextResponse.redirect(
      new URL("/auth/verify-email?error=expired", req.url)
    );
  }

  await prisma.user.update({
    where: { email: result.email },
    data: { emailVerified: new Date() },
  });

  return NextResponse.redirect(
    new URL("/auth/login?verified=1", req.url)
  );
}

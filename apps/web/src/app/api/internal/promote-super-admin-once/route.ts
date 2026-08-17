import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { prisma } from "@/lib/prisma";

/**
 * TEMPORARY. There is no self-service way to become SUPER_ADMIN, deliberately
 * — it decides who can approve a stranger's event for public listing. This
 * exists purely to grant the very first one, since there's no terminal or DB
 * console access on the deploying end to run that update directly. Delete
 * this route once that first account is promoted; every day afterward is a
 * day this secret-gated URL can promote a different account.
 *
 * GET rather than POST, same reasoning as the earlier one-time seed route:
 * the only tool available on the deploying end is a browser opening a link.
 * Requires an exact-match existing account (must already exist — this never
 * creates one) and returns its previous role, so a repeat call on an
 * already-promoted account is an obviously-harmless no-op to read back.
 */
const SECRET = "fc6f377554d2f7d10ca65f096eb185b4ae6cda1ff4da5a86";

function isAuthorized(req: NextRequest): boolean {
  const provided = req.nextUrl.searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const email = req.nextUrl.searchParams.get("email")?.trim().toLowerCase();
  if (!email) {
    return NextResponse.json({ error: "Missing ?email=" }, { status: 400 });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email }, select: { id: true, role: true, email: true } });
    if (!user) {
      return NextResponse.json({ error: `No account with email ${email}. Sign up first, then retry this link.` }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: user.id },
      data: { role: "SUPER_ADMIN" },
      select: { email: true, role: true },
    });

    return NextResponse.json({ ok: true, previousRole: user.role, account: updated });
  } catch (err) {
    console.error("[promote-super-admin-once] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

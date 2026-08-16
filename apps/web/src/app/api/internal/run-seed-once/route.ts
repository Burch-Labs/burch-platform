import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runSeed } from "@/lib/seed-data";

/**
 * TEMPORARY. Exists to populate a freshly-created production database that
 * has no terminal access to run `npm run db:seed` against directly. Delete
 * this route once the target database has been seeded — it has no reason to
 * exist afterward, and every day it stays is a day an unauthenticated POST
 * can re-run seeding against production.
 *
 * The seed itself is safe to call more than once regardless: every insert is
 * guarded by a find-by-name check first, so a repeat call is a no-op rather
 * than a duplicate.
 */
const SECRET = "ba49ce9bcbe1583433daa2b5442ab0ed2c5769609ba4e3b2";

function isAuthorized(req: NextRequest): boolean {
  const provided = req.nextUrl.searchParams.get("secret") ?? "";
  const a = Buffer.from(provided);
  const b = Buffer.from(SECRET);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function POST(req: NextRequest) {
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  try {
    const summary = await runSeed();
    return NextResponse.json({ ok: true, summary });
  } catch (err) {
    console.error("[run-seed-once] failed:", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : String(err) },
      { status: 500 }
    );
  }
}

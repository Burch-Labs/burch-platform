import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { runSeed } from "@/lib/seed-data";

/**
 * TEMPORARY. Exists to populate a freshly-created production database that
 * has no terminal access to run `npm run db:seed` against directly. Delete
 * this route once the target database has been seeded — it has no reason to
 * exist afterward, and every day it stays is a day this secret-gated URL can
 * re-run seeding against production.
 *
 * GET rather than POST, deliberately: this has to be triggerable by opening
 * a link in a phone's browser, which is the only tool actually available on
 * the deploying end this time. Ordinarily a mutating action stays POST-only
 * exactly to stop a link click from doing something unwanted — the offsetting
 * fact here is that the seed is idempotent (see below) and this route is
 * deleted the moment it's served its purpose.
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

export async function GET(req: NextRequest) {
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

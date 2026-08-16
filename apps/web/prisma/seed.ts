/**
 * CLI entry point for `npm run db:seed`.
 *
 * The actual data and seeding logic live in src/lib/seed-data.ts, shared with
 * the one-time HTTP-triggered seed route used when there is no way to run a
 * terminal against the target database directly.
 */
import { runSeed } from "../src/lib/seed-data";

runSeed().catch((e) => {
  console.error(e);
  process.exit(1);
});

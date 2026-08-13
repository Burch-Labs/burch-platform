/**
 * Unit tests for GET /api/health
 *
 * Covers:
 *  - Returns 503 with "degraded" status and NEXTAUTH_SECRET error key when
 *    neither NEXTAUTH_SECRET nor SESSION_SECRET is set
 *  - Returns 200 with "ok" status when all required vars are present
 *  - Returns 200 when SESSION_SECRET is used as the secret instead of NEXTAUTH_SECRET
 *  - Response body always includes a timestamp field
 *
 * config-check.ts evaluates at module-load time and caches results, so each
 * scenario must re-require the modules with a fresh environment. We use
 * jest.isolateModules() with synchronous require() to guarantee the module
 * registry is wiped and the env vars are read again on each test.
 */

// ── Types ──────────────────────────────────────────────────────────────────────

type HealthRouteModule = {
  GET: () => Promise<Response>;
};

// ── Helpers ────────────────────────────────────────────────────────────────────

const CONTROLLED_KEYS = [
  "NEXTAUTH_SECRET",
  "SESSION_SECRET",
  "NEXTAUTH_URL",
  "REPLIT_DOMAINS",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "RESEND_API_KEY",
  "NODE_ENV",
] as const;

/**
 * Synchronously require the health route handler inside a fresh module
 * registry, with process.env set exactly to the provided values for the
 * controlled keys (all others are left untouched).
 */
function loadHealthRouteWithEnv(env: Partial<Record<(typeof CONTROLLED_KEYS)[number], string>>): HealthRouteModule {
  // Save and clear all controlled keys
  const snapshot: Record<string, string | undefined> = {};
  for (const k of CONTROLLED_KEYS) {
    snapshot[k] = process.env[k];
    delete process.env[k];
  }

  // Apply the requested env for this scenario.
  // Cast to a plain record to avoid the readonly NODE_ENV type constraint.
  const mutableEnv = process.env as Record<string, string | undefined>;
  for (const [k, v] of Object.entries(env) as [string, string | undefined][]) {
    if (v !== undefined) {
      mutableEnv[k] = v;
    }
  }

  let handler!: HealthRouteModule;

  // isolateModules + synchronous require() ensures config-check.ts re-runs
  // its top-level checkConfig() call with the new env in place.
  jest.isolateModules(() => {
    // Load config-check first so its side-effects (logging) run in isolation
    require("@/lib/config-check");
    handler = require("@/app/api/health/route") as HealthRouteModule;
  });

  // Restore original env immediately after the synchronous require
  const mutableEnvRestore = process.env as Record<string, string | undefined>;
  for (const k of CONTROLLED_KEYS) {
    if (snapshot[k] === undefined) {
      delete mutableEnvRestore[k];
    } else {
      mutableEnvRestore[k] = snapshot[k];
    }
  }

  return handler;
}

// ── Tests ──────────────────────────────────────────────────────────────────────

describe("GET /api/health", () => {
  it("returns 503 with status=degraded and NEXTAUTH_SECRET error key when secret is missing", async () => {
    const { GET } = loadHealthRouteWithEnv({
      // Deliberately omit both secret vars
      NEXTAUTH_URL: "http://localhost:5000",
      RESEND_API_KEY: "re_test_key",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");

    const errorKeys: string[] = body.config.errors.map(
      (e: { key: string }) => e.key
    );
    expect(errorKeys).toContain("NEXTAUTH_SECRET");
  });

  it("returns 200 with status=ok when NEXTAUTH_SECRET and other required vars are set", async () => {
    const { GET } = loadHealthRouteWithEnv({
      NEXTAUTH_SECRET: "a-very-long-random-secret-string",
      NEXTAUTH_URL: "http://localhost:5000",
      RESEND_API_KEY: "re_test_key",
      // Both Google vars absent → warning only, not an error
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.config.errors).toHaveLength(0);
  });

  it("returns 200 when SESSION_SECRET satisfies the secret requirement instead of NEXTAUTH_SECRET", async () => {
    const { GET } = loadHealthRouteWithEnv({
      SESSION_SECRET: "session-secret-long-enough",
      NEXTAUTH_URL: "http://localhost:5000",
      RESEND_API_KEY: "re_test_key",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.status).toBe("ok");
    expect(body.config.errors).toHaveLength(0);
  });

  it("flags malformed Google OAuth client IDs as configuration errors", async () => {
    const { GET } = loadHealthRouteWithEnv({
      NEXTAUTH_SECRET: "a-very-long-random-secret-string",
      NEXTAUTH_URL: "http://localhost:5000",
      RESEND_API_KEY: "re_test_key",
      GOOGLE_CLIENT_ID: "cd /workspaces/burch-platform gh auth status",
      GOOGLE_CLIENT_SECRET: "GOCSPX-test-secret-value",
    });

    const res = await GET();
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.status).toBe("degraded");

    const errorKeys: string[] = body.config.errors.map(
      (e: { key: string }) => e.key
    );
    expect(errorKeys).toContain("GOOGLE_CLIENT_ID");
  });

  it("response body always contains a parseable timestamp field", async () => {
    const { GET } = loadHealthRouteWithEnv({
      NEXTAUTH_SECRET: "some-secret",
      NEXTAUTH_URL: "http://localhost:5000",
      RESEND_API_KEY: "re_test_key",
    });

    const res = await GET();
    const body = await res.json();

    expect(typeof body.timestamp).toBe("string");
    expect(Number.isNaN(Date.parse(body.timestamp))).toBe(false);
  });
});

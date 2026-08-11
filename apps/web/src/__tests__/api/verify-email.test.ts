/**
 * Unit tests for GET /api/auth/verify-email
 *
 * Covers:
 *  - Missing token: returns 400 JSON error immediately
 *  - Valid token: verifies the user (sets emailVerified) and redirects to login?verified=1
 *  - Expired token: redirects to /auth/verify-email?error=expired, does NOT verify account
 *  - Already-consumed token: redirects to /auth/verify-email?error=invalid
 *  - Concurrent replay: two requests with the same token — only the first succeeds
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockValidateEmailVerificationToken = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock("@/lib/tokens", () => ({
  validateEmailVerificationToken: (...args: unknown[]) =>
    mockValidateEmailVerificationToken(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(token: string | null) {
  const params = new URLSearchParams(token !== null ? { token } : {});
  return {
    nextUrl: {
      searchParams: params,
    },
    url: "http://localhost:3000/api/auth/verify-email",
  } as unknown as import("next/server").NextRequest;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("GET /api/auth/verify-email", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockUserUpdate.mockResolvedValue({});
  });

  it("returns 400 when no token is provided in the request", async () => {
    const { GET } = await import("@/app/api/auth/verify-email/route");
    const res = await GET(makeRequest(null));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body).toEqual({ error: "Missing token." });
    expect(mockValidateEmailVerificationToken).not.toHaveBeenCalled();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("redirects to login?verified=1 for a valid token", async () => {
    mockValidateEmailVerificationToken.mockResolvedValue({
      email: "alice@example.com",
      expired: false,
    });

    const { GET } = await import("@/app/api/auth/verify-email/route");
    const res = await GET(makeRequest("valid-token"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/auth/login?verified=1");
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "alice@example.com" },
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    );
  });

  it("redirects to error=expired for an expired token", async () => {
    mockValidateEmailVerificationToken.mockResolvedValue({ expired: true });

    const { GET } = await import("@/app/api/auth/verify-email/route");
    const res = await GET(makeRequest("expired-token"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/auth/verify-email?error=expired"
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("redirects to error=invalid for an already-consumed token", async () => {
    mockValidateEmailVerificationToken.mockResolvedValue(null);

    const { GET } = await import("@/app/api/auth/verify-email/route");
    const res = await GET(makeRequest("used-token"));

    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain(
      "/auth/verify-email?error=invalid"
    );
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("only the first concurrent request succeeds; the second is rejected as invalid", async () => {
    // Simulate atomicity: the first call consumes the token, the second finds nothing.
    mockValidateEmailVerificationToken
      .mockResolvedValueOnce({ email: "bob@example.com", expired: false })
      .mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/auth/verify-email/route");
    const req1 = makeRequest("replay-token");
    const req2 = makeRequest("replay-token");

    // Fire both concurrently, exactly as two simultaneous browser tabs would.
    const [res1, res2] = await Promise.all([GET(req1), GET(req2)]);

    const loc1 = res1.headers.get("location") ?? "";
    const loc2 = res2.headers.get("location") ?? "";

    // Exactly one request reaches the success redirect.
    const successCount = [loc1, loc2].filter((l) =>
      l.includes("/auth/login?verified=1")
    ).length;
    const invalidCount = [loc1, loc2].filter((l) =>
      l.includes("/auth/verify-email?error=invalid")
    ).length;

    expect(successCount).toBe(1);
    expect(invalidCount).toBe(1);

    // The user record is only updated once.
    expect(mockUserUpdate).toHaveBeenCalledTimes(1);
  });
});

export {};

/**
 * Unit tests for POST /api/auth/resend-verification
 *
 * Covers:
 *  - Returns 429 with retryAfter when called within the 60-second window
 *  - Returns 200 and sends email on first call (no rate limit record)
 *  - Returns 400 when email is already verified
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockRateLimitFindUnique = jest.fn();
const mockRateLimitUpsert = jest.fn();
const mockUserFindUnique = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    emailResendRateLimit: {
      deleteMany: jest.fn().mockResolvedValue({ count: 0 }),
      findUnique: (...args: unknown[]) => mockRateLimitFindUnique(...args),
      upsert: (...args: unknown[]) => mockRateLimitUpsert(...args),
    },
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

const mockSendVerificationEmail = jest.fn();

jest.mock("@/lib/email", () => ({
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}));

jest.mock("@/lib/tokens", () => ({
  createEmailVerificationToken: jest.fn().mockResolvedValue("resend-token-abc"),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as import("next/server").NextRequest;
}

const RATE_LIMIT_MS = 60_000;

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/resend-verification", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockRateLimitUpsert.mockResolvedValue({});
    mockUserUpdate.mockResolvedValue({});
    mockSendVerificationEmail.mockResolvedValue(undefined);
  });

  it("returns 429 with retryAfter when within the 60-second cooldown window", async () => {
    // Simulate a record created 20 seconds ago — 40 seconds remain
    const secondsAgo = 20;
    mockRateLimitFindUnique.mockResolvedValue({
      email: "eve@example.com",
      lastSentAt: new Date(Date.now() - secondsAgo * 1000),
    });
    mockUserFindUnique.mockResolvedValue({ id: "u1", emailVerified: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const req = makeRequest({ email: "eve@example.com" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(typeof body.retryAfter).toBe("number");
    // retryAfter should be approximately 40s (allow ±2s for timing)
    expect(body.retryAfter).toBeGreaterThanOrEqual(38);
    expect(body.retryAfter).toBeLessThanOrEqual(42);
    expect(body.error).toMatch(/wait/i);
  });

  it("returns 429 even when only 1 second remains in the cooldown", async () => {
    mockRateLimitFindUnique.mockResolvedValue({
      email: "eve@example.com",
      lastSentAt: new Date(Date.now() - (RATE_LIMIT_MS - 999)),
    });
    mockUserFindUnique.mockResolvedValue({ id: "u1", emailVerified: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const req = makeRequest({ email: "eve@example.com" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(429);
    expect(body.retryAfter).toBe(1);
  });

  it("sends email and returns 200 when no rate limit record exists", async () => {
    mockRateLimitFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ id: "u2", emailVerified: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const req = makeRequest({ email: "frank@example.com" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toMatch(/sent/i);
    expect(mockSendVerificationEmail).toHaveBeenCalledWith("frank@example.com", "resend-token-abc");
    expect(mockRateLimitUpsert).toHaveBeenCalled();
  });

  it("allows resend after the 60-second window has passed", async () => {
    // Record from 61 seconds ago — window has passed
    mockRateLimitFindUnique.mockResolvedValue({
      email: "grace@example.com",
      lastSentAt: new Date(Date.now() - 61_000),
    });
    mockUserFindUnique.mockResolvedValue({ id: "u3", emailVerified: null });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const req = makeRequest({ email: "grace@example.com" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.message).toMatch(/sent/i);
  });

  it("returns 400 when the email is already verified", async () => {
    mockRateLimitFindUnique.mockResolvedValue(null);
    mockUserFindUnique.mockResolvedValue({ id: "u4", emailVerified: new Date() });

    const { POST } = await import("@/app/api/auth/resend-verification/route");
    const req = makeRequest({ email: "henry@example.com" });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error).toMatch(/already verified/i);
  });
});

export {};

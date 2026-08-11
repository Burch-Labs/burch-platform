/**
 * Unit tests for POST /api/auth/reset-password (route layer)
 *
 * These tests exercise the HTTP route's handling of the three outcomes that
 * validatePasswordResetToken can return. The concurrent/atomic-delete
 * behaviour is verified at the token layer in tokens-reset-password.test.ts,
 * which drives validatePasswordResetToken directly against a Prisma mock
 * that simulates the DB's atomic DELETE guarantee.
 *
 * Covers:
 *  - Valid token: 200 + password updated
 *  - Expired token: 400 with "expired" error
 *  - Already-consumed token: 400 with "invalid or already been used" error
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockValidatePasswordResetToken = jest.fn();
const mockUserUpdate = jest.fn();
const mockHash = jest.fn();

jest.mock("@/lib/tokens", () => ({
  validatePasswordResetToken: (...args: unknown[]) =>
    mockValidatePasswordResetToken(...args),
}));

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

jest.mock("bcryptjs", () => ({
  hash: (...args: unknown[]) => mockHash(...args),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeResetRequest(body: Record<string, string>) {
  return {
    json: () => Promise.resolve(body),
    url: "http://localhost:3000/api/auth/reset-password",
  } as unknown as import("next/server").NextRequest;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
    mockUserUpdate.mockResolvedValue({});
    mockHash.mockResolvedValue("hashed-password");
  });

  it("returns 200 and updates the password when the token is valid", async () => {
    mockValidatePasswordResetToken.mockResolvedValue({
      email: "alice@example.com",
      expired: false,
    });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeResetRequest({ token: "valid-token", password: "newpassword123" }));

    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.message).toMatch(/password updated/i);
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "alice@example.com" },
        data: expect.objectContaining({ password: "hashed-password" }),
      })
    );
  });

  it("returns 400 with an expired message when the token has passed its window", async () => {
    mockValidatePasswordResetToken.mockResolvedValue({ expired: true });

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeResetRequest({ token: "expired-token", password: "newpassword123" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/expired/i);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("returns 400 with an invalid message when the token has already been consumed", async () => {
    mockValidatePasswordResetToken.mockResolvedValue(null);

    const { POST } = await import("@/app/api/auth/reset-password/route");
    const res = await POST(makeResetRequest({ token: "used-token", password: "newpassword123" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/invalid|already been used/i);
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });
});

export {};

/**
 * Unit tests for POST /api/auth/register
 *
 * Covers:
 *  - Returns emailFailed: true (and auto-verifies) when sendVerificationEmail throws
 *  - Returns autoVerified: true without emailFailed when HAS_RESEND is false
 *  - Returns 409 when email already exists
 *  - Returns autoVerified: false on the happy path (email sent successfully)
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockUserFindUnique = jest.fn();
const mockUserCreate = jest.fn();
const mockUserUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    user: {
      findUnique: (...args: unknown[]) => mockUserFindUnique(...args),
      create: (...args: unknown[]) => mockUserCreate(...args),
      update: (...args: unknown[]) => mockUserUpdate(...args),
    },
  },
}));

// Control HAS_RESEND via this variable
let hasResend = true;
const mockSendVerificationEmail = jest.fn();

jest.mock("@/lib/email", () => ({
  get HAS_RESEND() {
    return hasResend;
  },
  sendVerificationEmail: (...args: unknown[]) => mockSendVerificationEmail(...args),
}));

jest.mock("@/lib/tokens", () => ({
  createEmailVerificationToken: jest.fn().mockResolvedValue("test-token-123"),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as import("next/server").NextRequest;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    hasResend = true;
    mockUserFindUnique.mockResolvedValue(null); // no existing user by default
    mockUserCreate.mockResolvedValue({});
    mockUserUpdate.mockResolvedValue({});
  });

  it("returns emailFailed: true and auto-verifies when sendVerificationEmail throws", async () => {
    mockSendVerificationEmail.mockRejectedValue(new Error("Resend domain not verified"));

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Alice",
      email: "alice@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.emailFailed).toBe(true);
    expect(body.autoVerified).toBe(true);

    // User should have been auto-verified in the DB
    expect(mockUserUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: "alice@example.com" },
        data: expect.objectContaining({ emailVerified: expect.any(Date) }),
      })
    );
  });

  it("returns autoVerified: false (no emailFailed) on happy path when email sends", async () => {
    mockSendVerificationEmail.mockResolvedValue(undefined);

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Bob",
      email: "bob@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.autoVerified).toBe(false);
    expect(body.emailFailed).toBeUndefined();
    expect(mockUserUpdate).not.toHaveBeenCalled();
  });

  it("returns autoVerified: true (no emailFailed) when HAS_RESEND is false", async () => {
    hasResend = false;

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Carol",
      email: "carol@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(201);
    expect(body.autoVerified).toBe(true);
    expect(body.emailFailed).toBeUndefined();
    expect(mockSendVerificationEmail).not.toHaveBeenCalled();
  });

  it("returns 409 when the email is already registered", async () => {
    mockUserFindUnique.mockResolvedValue({ id: "existing-user" });

    const { POST } = await import("@/app/api/auth/register/route");
    const req = makeRequest({
      name: "Dave",
      email: "dave@example.com",
      password: "password123",
      role: "CUSTOMER",
    });

    const res = await POST(req);
    const body = await res.json();

    expect(res.status).toBe(409);
    expect(body.error).toMatch(/already exists/i);
  });
});

/**
 * Sign-in code policy.
 *
 * Six digits is a small keyspace, so the security of passwordless sign-in rests
 * entirely on the limits around it. Each test below pins one of those limits;
 * if any starts failing, brute-forcing an account has become cheaper.
 */
const mockCount = jest.fn();
const mockCreate = jest.fn();
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();
const mockUpdateMany = jest.fn();
const mockDeleteMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    signInCode: {
      count:      (...a: unknown[]) => mockCount(...a),
      create:     (...a: unknown[]) => mockCreate(...a),
      findFirst:  (...a: unknown[]) => mockFindFirst(...a),
      update:     (...a: unknown[]) => mockUpdate(...a),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
      deleteMany: (...a: unknown[]) => mockDeleteMany(...a),
    },
  },
}));

import { hash } from "bcryptjs";
import {
  normalizeIdentifier,
  requestSignInCode,
  verifySignInCode,
  SIGN_IN_CODE_POLICY,
} from "@/lib/signin-codes";

const EMAIL = "ada@example.com";

beforeEach(() => {
  jest.clearAllMocks();
  mockCount.mockResolvedValue(0);
  mockCreate.mockResolvedValue({});
  mockUpdate.mockResolvedValue({});
  mockUpdateMany.mockResolvedValue({ count: 1 });
  mockDeleteMany.mockResolvedValue({ count: 0 });
});

describe("identifier normalisation", () => {
  it.each([
    ["Ada@Example.com", "ada@example.com"],
    ["  ada@example.com  ", "ada@example.com"],
    ["ADA@EXAMPLE.COM", "ada@example.com"],
  ])("maps %s to a single key", (input, expected) => {
    // Varying case must not create a fresh rate-limit budget.
    expect(normalizeIdentifier(input)).toBe(expected);
  });
});

describe("requesting a code", () => {
  it("issues a code of the configured length, all digits", async () => {
    const result = await requestSignInCode(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.code).toMatch(
      new RegExp(`^\\d{${SIGN_IN_CODE_POLICY.CODE_LENGTH}}$`)
    );
  });

  it("stores only a hash, never the code itself", async () => {
    const result = await requestSignInCode(EMAIL);
    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const stored = mockCreate.mock.calls[0][0].data;
    // A database read must not yield a usable code.
    expect(stored.codeHash).not.toBe(result.code);
    expect(JSON.stringify(stored)).not.toContain(result.code);
  });

  it("retires any outstanding code before issuing a new one", async () => {
    await requestSignInCode(EMAIL);
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ identifier: EMAIL, consumedAt: null }),
      })
    );
  });

  it("refuses once the issuance budget is spent", async () => {
    // Without this an attacker buys unlimited guesses by re-requesting, and can
    // bomb someone else's inbox at will.
    mockCount.mockResolvedValueOnce(SIGN_IN_CODE_POLICY.MAX_CODES_PER_WINDOW);
    const result = await requestSignInCode(EMAIL);
    expect(result).toEqual({
      ok: false,
      reason: "rate-limited",
      retryAfterMinutes: SIGN_IN_CODE_POLICY.WINDOW_MINUTES,
    });
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("counts the budget against the normalised identifier", async () => {
    await requestSignInCode("  ADA@Example.com ");
    expect(mockCount).toHaveBeenCalledWith(
      expect.objectContaining({ where: expect.objectContaining({ identifier: EMAIL }) })
    );
  });
});

describe("verifying a code", () => {
  async function record(over: Partial<Record<string, unknown>> = {}) {
    return {
      id: "code-1",
      identifier: EMAIL,
      codeHash: await hash("123456", 10),
      expiresAt: new Date(Date.now() + 60_000),
      attempts: 0,
      consumedAt: null,
      createdAt: new Date(),
      ...over,
    };
  }

  it("accepts the correct code", async () => {
    mockFindFirst.mockResolvedValueOnce(await record());
    expect(await verifySignInCode(EMAIL, "123456")).toEqual({ ok: true });
  });

  it("burns the code on success so it cannot be replayed", async () => {
    mockFindFirst.mockResolvedValueOnce(await record());
    await verifySignInCode(EMAIL, "123456");
    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "code-1", consumedAt: null },
        data: expect.objectContaining({ consumedAt: expect.any(Date) }),
      })
    );
  });

  it("refuses when a concurrent request consumed it first", async () => {
    mockFindFirst.mockResolvedValueOnce(await record());
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });
    expect(await verifySignInCode(EMAIL, "123456")).toEqual({ ok: false, reason: "no-code" });
  });

  it("rejects a wrong code and spends an attempt", async () => {
    mockFindFirst.mockResolvedValueOnce(await record());
    const result = await verifySignInCode(EMAIL, "000000");
    expect(result).toEqual({ ok: false, reason: "incorrect" });
    // The increment is what makes the attempt budget real.
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ data: { attempts: { increment: 1 } } })
    );
  });

  it("stops accepting guesses once the attempt limit is reached", async () => {
    mockFindFirst.mockResolvedValueOnce(
      await record({ attempts: SIGN_IN_CODE_POLICY.ATTEMPT_LIMIT })
    );
    const result = await verifySignInCode(EMAIL, "123456");
    // Correct code, but the budget is gone — this is the brute-force ceiling.
    expect(result).toEqual({ ok: false, reason: "too-many-attempts" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("rejects an expired code even when correct", async () => {
    mockFindFirst.mockResolvedValueOnce(
      await record({ expiresAt: new Date(Date.now() - 1_000) })
    );
    expect(await verifySignInCode(EMAIL, "123456")).toEqual({ ok: false, reason: "expired" });
  });

  it("reports no-code when none is outstanding", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    expect(await verifySignInCode(EMAIL, "123456")).toEqual({ ok: false, reason: "no-code" });
  });

  it("only ever looks at unconsumed codes", async () => {
    mockFindFirst.mockResolvedValueOnce(null);
    await verifySignInCode(EMAIL, "123456");
    expect(mockFindFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { identifier: EMAIL, consumedAt: null },
      })
    );
  });
});

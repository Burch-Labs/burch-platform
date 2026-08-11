/**
 * Unit tests for validatePasswordResetToken (apps/web/src/lib/tokens.ts)
 *
 * These tests exercise the token-consumption logic directly — the Prisma
 * mock is configured to simulate the database's atomic DELETE behaviour,
 * so a regression from atomic delete to find-then-delete would produce
 * different mock call patterns and break the concurrent-replay assertions.
 *
 * Covers:
 *  - Concurrent replay: two concurrent calls with the same token — only the
 *    first DELETE wins; the second sees P2025 (record gone) and returns null
 *  - Expired token: DELETE returns the record but its expires date is in the past
 *  - Already-consumed token: DELETE throws P2025 immediately → null
 */

// ── Prisma mock ───────────────────────────────────────────────────────────────

const mockDelete = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    passwordResetToken: {
      delete: (...args: unknown[]) => mockDelete(...args),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Simulate the Prisma "Record not found" error (code P2025) */
function p2025(): Error {
  const err = new Error("Record to delete does not exist.") as Error & {
    code: string;
  };
  (err as { code: string }).code = "P2025";
  return err;
}

function futureDate(msFromNow = 60_000): Date {
  return new Date(Date.now() + msFromNow);
}

function pastDate(msAgo = 60_000): Date {
  return new Date(Date.now() - msAgo);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("validatePasswordResetToken", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.resetModules();
  });

  it("returns { email, expired: false } when the token is valid and not yet expired", async () => {
    mockDelete.mockResolvedValueOnce({
      token: "good-token",
      email: "alice@example.com",
      expires: futureDate(),
    });

    const { validatePasswordResetToken } = await import("@/lib/tokens");
    const result = await validatePasswordResetToken("good-token");

    expect(result).toEqual({ email: "alice@example.com", expired: false });
    // The token must have been deleted — not just looked up.
    expect(mockDelete).toHaveBeenCalledTimes(1);
    expect(mockDelete).toHaveBeenCalledWith({ where: { token: "good-token" } });
  });

  it("returns { expired: true } when the token existed but its window has passed", async () => {
    mockDelete.mockResolvedValueOnce({
      token: "old-token",
      email: "bob@example.com",
      expires: pastDate(60 * 60 * 1000), // 1 h ago
    });

    const { validatePasswordResetToken } = await import("@/lib/tokens");
    const result = await validatePasswordResetToken("old-token");

    expect(result).toEqual({ expired: true });
    // Even an expired token must be consumed so it cannot be retried.
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("returns null when the token has already been consumed (P2025 from Prisma)", async () => {
    mockDelete.mockRejectedValueOnce(p2025());

    const { validatePasswordResetToken } = await import("@/lib/tokens");
    const result = await validatePasswordResetToken("used-token");

    expect(result).toBeNull();
    expect(mockDelete).toHaveBeenCalledTimes(1);
  });

  it("concurrent replay: only one call succeeds; the second is rejected as null", async () => {
    /**
     * Simulate the database's atomic DELETE guarantee:
     *  - The first concurrent DELETE removes the row and returns it.
     *  - The second concurrent DELETE finds no row and throws P2025.
     *
     * This is the only outcome possible with an atomic DB-level delete. If
     * the implementation were to regress to a find-then-delete approach the
     * mock call count or argument patterns would change and the test would
     * expose the regression via unexpected mock interactions.
     */
    mockDelete
      .mockResolvedValueOnce({
        token: "replay-token",
        email: "carol@example.com",
        expires: futureDate(),
      })
      .mockRejectedValueOnce(p2025());

    const { validatePasswordResetToken } = await import("@/lib/tokens");

    // Fire both calls concurrently, exactly as two simultaneous browser tabs would.
    const [result1, result2] = await Promise.all([
      validatePasswordResetToken("replay-token"),
      validatePasswordResetToken("replay-token"),
    ]);

    const results = [result1, result2];

    // Exactly one call must succeed with a valid result.
    const successes = results.filter(
      (r) => r !== null && !("expired" in r && r.expired)
    );
    // Exactly one call must return null (token already gone).
    const nulls = results.filter((r) => r === null);

    expect(successes).toHaveLength(1);
    expect(nulls).toHaveLength(1);
    expect(successes[0]).toEqual({ email: "carol@example.com", expired: false });

    // The database DELETE was attempted exactly twice — once per concurrent caller.
    expect(mockDelete).toHaveBeenCalledTimes(2);
    expect(mockDelete).toHaveBeenNthCalledWith(1, {
      where: { token: "replay-token" },
    });
    expect(mockDelete).toHaveBeenNthCalledWith(2, {
      where: { token: "replay-token" },
    });
  });
});

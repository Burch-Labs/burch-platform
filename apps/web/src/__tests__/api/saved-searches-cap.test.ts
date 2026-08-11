/**
 * Unit tests for POST /api/saved-searches — 20-search cap
 *
 * Covers:
 *  - Returns 422 with the cap error message when the user already has 20 saved searches
 *  - Creates the search (201) when the user is below the cap
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockCount = jest.fn();
const mockCreate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    savedSearch: {
      count: (...args: unknown[]) => mockCount(...args),
      create: (...args: unknown[]) => mockCreate(...args),
      findMany: jest.fn(),
    },
  },
}));

const mockGetServerSession = jest.fn();
jest.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

// Static import must come after jest.mock() calls.
// eslint-disable-next-line import/first
import { POST } from "@/app/api/saved-searches/route";

// ── Helpers ───────────────────────────────────────────────────────────────────

function makeRequest(body: Record<string, unknown>) {
  return {
    json: jest.fn().mockResolvedValue(body),
  } as unknown as import("next/server").NextRequest;
}

const CAP_MESSAGE =
  "You have reached the maximum of 20 saved searches. Delete one to save a new search.";

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("POST /api/saved-searches — saved-search cap", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetServerSession.mockResolvedValue({ user: { id: "user-1" } });
  });

  it("returns 422 with the cap message when the user already has 20 saved searches", async () => {
    mockCount.mockResolvedValue(20);

    const res = await POST(makeRequest({ name: "My 21st search" }));

    expect(res.status).toBe(422);
    const data = await res.json();
    expect(data.error).toBe(CAP_MESSAGE);
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it("creates the search when the user is below the cap", async () => {
    mockCount.mockResolvedValue(19);
    mockCreate.mockResolvedValue({ id: "s-20", name: "My 20th search" });

    const res = await POST(makeRequest({ name: "My 20th search" }));

    expect(res.status).toBe(201);
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});

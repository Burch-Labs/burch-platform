/**
 * Tests for the past-start-date guard in updateEvent
 * (apps/web/src/app/partner/events/actions.ts)
 *
 * Covers:
 *  - Updating a published event whose startDate is in the past is rejected with
 *    an error and the Prisma update is never called.
 *  - Updating a draft event whose startDate is in the past succeeds (drafts are
 *    exempt from the guard so partners can keep working on them).
 */

// ── Mocks ─────────────────────────────────────────────────────────────────────

// next-auth — return a PARTNER session so requirePartner() passes.
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

// authOptions — the real value is irrelevant here; just needs to be importable.
jest.mock("@/lib/auth", () => ({ authOptions: {} }));

// next/cache — no-ops so revalidateTag / revalidatePath don't throw.
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
  revalidateTag: jest.fn(),
}));

// next/navigation — Next.js redirect() throws a special internal error at
// runtime so the function never returns a value on the happy path.  Replicate
// that behaviour here so callers get the same control-flow.
const REDIRECT_ERROR = new Error("NEXT_REDIRECT");
jest.mock("next/navigation", () => ({
  redirect: jest.fn().mockImplementation(() => { throw REDIRECT_ERROR; }),
}));

// @prisma/client — stub out the enum used by parseFormData.
jest.mock("@prisma/client", () => ({
  EventCategory: {},
  PrismaClient: jest.fn(),
}));

// Prisma — spy on findFirst and update.
const mockFindFirst = jest.fn();
const mockUpdate = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    partner: {
      findUnique: jest.fn().mockResolvedValue({ id: "partner-1" }),
    },
    event: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
      update:    (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";

const mockGetServerSession = getServerSession as jest.Mock;
const mockRedirect = redirect as jest.Mock;

/** Build a minimal FormData for updateEvent. */
function makeFormData(overrides: Record<string, string | boolean> = {}): FormData {
  const past = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // yesterday
  const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // +7 days

  const defaults: Record<string, string> = {
    title:     "Test Event",
    location:  "Test Venue",
    city:      "Nairobi",
    category:  "OTHER",
    startDate: past,
    endDate:   future,
    price:     "100",
    currency:  "KES",
    capacity:  "50",
  };

  const merged = { ...defaults, ...overrides };

  const fd = new FormData();
  for (const [key, value] of Object.entries(merged)) {
    if (key === "published") {
      if (value === true || value === "true") {
        fd.append("published", "true");
      }
      // omit the field entirely when falsy (checkbox absent = unchecked)
    } else {
      fd.append(key, String(value));
    }
  }
  return fd;
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();

  // Provide a valid PARTNER session.
  mockGetServerSession.mockResolvedValue({
    user: { id: "user-1", role: "PARTNER" },
  });

  // The event exists and belongs to this partner.
  mockFindFirst.mockResolvedValue({ id: "event-1", published: true });

  // update succeeds by default.
  mockUpdate.mockResolvedValue({});

  // Restore redirect to throw NEXT_REDIRECT (clearAllMocks wipes implementations).
  mockRedirect.mockImplementation(() => { throw REDIRECT_ERROR; });
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("updateEvent — past-start-date guard", () => {
  it("rejects a published event update when startDate is in the past", async () => {
    const { updateEvent } = await import("@/app/partner/events/actions");

    const fd = makeFormData({ published: true }); // startDate defaults to yesterday
    const result = await updateEvent("event-1", null, fd);

    expect(result.error).toMatch(/past/i);
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("does not persist the change when the published + past-date guard fires", async () => {
    const { updateEvent } = await import("@/app/partner/events/actions");

    const fd = makeFormData({ published: true });
    await updateEvent("event-1", null, fd);

    // Prisma update must never be called.
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("allows a draft event to be updated with a past startDate", async () => {
    const { updateEvent } = await import("@/app/partner/events/actions");

    // published checkbox absent → draft
    const fd = makeFormData(); // no published field

    // On success updateEvent calls redirect(), which throws NEXT_REDIRECT.
    // Any other thrown value (or a returned { error }) means the guard fired.
    let threwRedirect = false;
    try {
      await updateEvent("event-1", null, fd);
    } catch (e) {
      if (e === REDIRECT_ERROR) threwRedirect = true;
      else throw e;
    }

    // The update was persisted and then redirect was called.
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(threwRedirect).toBe(true);
  });

  it("allows a published event to be updated when startDate is in the future", async () => {
    const { updateEvent } = await import("@/app/partner/events/actions");

    const future = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const fd = makeFormData({ startDate: future, published: true });

    let threwRedirect = false;
    try {
      await updateEvent("event-1", null, fd);
    } catch (e) {
      if (e === REDIRECT_ERROR) threwRedirect = true;
      else throw e;
    }

    expect(mockUpdate).toHaveBeenCalledTimes(1);
    expect(threwRedirect).toBe(true);
  });
});

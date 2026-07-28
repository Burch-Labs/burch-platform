/**
 * Tests for events-listing cache behaviour in apps/web/src/app/events/page.tsx
 *
 * Covers:
 *  - Two different filter combinations produce distinct cache-key arrays so they
 *    are stored as separate entries and never collide.
 *  - Every cache entry is tagged with the broad "events-listing" tag so a single
 *    revalidateTag("events-listing") call (fired after publish / cancel) wipes all
 *    filter variants at once.
 *  - The per-filter tag also differs between filter combinations, allowing
 *    targeted revalidation of individual entries in the future.
 */

// ── Types ─────────────────────────────────────────────────────────────────────

interface CacheCall {
  keys: string[];
  tags: string[];
}

// ── Mocks ─────────────────────────────────────────────────────────────────────

const cacheCallLog: CacheCall[] = [];

// Replace unstable_cache with a spy that:
//  1. Records the key parts and tags for each call.
//  2. Immediately invokes the wrapped async function so the test gets real data.
jest.mock("next/cache", () => ({
  unstable_cache: (
    fn: () => Promise<unknown>,
    keys: string[],
    opts: { revalidate?: number; tags?: string[] },
  ) => {
    cacheCallLog.push({ keys, tags: opts?.tags ?? [] });
    // Return a thunk that mirrors the real API: `unstable_cache(fn, keys, opts)()`
    return fn;
  },
}));

// Minimal Prisma stub – returns stable fixtures so DB is not hit.
const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    event: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Prisma client types are imported transitively via @prisma/client; stub it out.
jest.mock("@prisma/client", () => ({
  EventCategory: {},
  PrismaClient: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the cache call that matches the given filter tag prefix. */
function callFor(q: string, category: string, city: string): CacheCall | undefined {
  return cacheCallLog.find((c) => c.keys[1] === q && c.keys[2] === category && c.keys[3] === city);
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  cacheCallLog.length = 0;
  jest.resetModules();

  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("events-listing cache key isolation", () => {
  it("uses distinct cache-key arrays for two different filter combinations", async () => {
    const { getEventsData } = await import("@/lib/events-data");

    await getEventsData("music", "MUSIC", "Nairobi", "", "", 1);
    await getEventsData("food",  "FOOD",  "Lagos",   "", "", 1);

    const call1 = callFor("music", "MUSIC", "Nairobi");
    const call2 = callFor("food",  "FOOD",  "Lagos");

    expect(call1).toBeDefined();
    expect(call2).toBeDefined();

    // Key arrays must differ so the two results occupy separate cache slots.
    expect(call1!.keys).not.toEqual(call2!.keys);
  });

  it("gives each filter combination a unique per-filter cache tag", async () => {
    const { getEventsData } = await import("@/lib/events-data");

    await getEventsData("jazz", "MUSIC", "Nairobi", "", "", 1);
    await getEventsData("jazz", "MUSIC", "Lagos",   "", "", 1);

    const call1 = callFor("jazz", "MUSIC", "Nairobi");
    const call2 = callFor("jazz", "MUSIC", "Lagos");

    // The per-filter tag encodes every parameter; city difference must be visible.
    const filterTag1 = call1!.tags.find((t) => t.startsWith("events-listing:"));
    const filterTag2 = call2!.tags.find((t) => t.startsWith("events-listing:"));

    expect(filterTag1).toBeDefined();
    expect(filterTag2).toBeDefined();
    expect(filterTag1).not.toBe(filterTag2);
  });

  it("page number is included in the cache key so page 1 and page 2 are separate entries", async () => {
    const { getEventsData } = await import("@/lib/events-data");

    await getEventsData("", "", "", "", "", 1);
    await getEventsData("", "", "", "", "", 2);

    const callP1 = cacheCallLog.find((c) => c.keys[6] === "1");
    const callP2 = cacheCallLog.find((c) => c.keys[6] === "2");

    expect(callP1).toBeDefined();
    expect(callP2).toBeDefined();
    expect(callP1!.keys).not.toEqual(callP2!.keys);
  });
});

describe("events-listing broad revalidation tag", () => {
  it('every cache entry carries the "events-listing" tag so revalidateTag wipes all variants', async () => {
    const { getEventsData } = await import("@/lib/events-data");

    // Simulate several different filter combinations a visitor might request.
    const filterSets: [string, string, string, string, string, number][] = [
      ["",       "",       "",        "", "", 1],
      ["music",  "MUSIC",  "Nairobi", "", "", 1],
      ["food",   "FOOD",   "Lagos",   "", "", 2],
      ["market", "OTHER",  "Accra",   "2026-08-01", "2026-08-31", 1],
    ];

    for (const args of filterSets) {
      await getEventsData(...args);
    }

    expect(cacheCallLog).toHaveLength(filterSets.length);

    // Every single entry must include the broad tag so one revalidateTag call
    // is sufficient to bust the entire listing cache after a publish or cancel.
    for (const call of cacheCallLog) {
      expect(call.tags).toContain("events-listing");
    }
  });

  it('each entry also carries a unique per-filter tag alongside "events-listing"', async () => {
    const { getEventsData } = await import("@/lib/events-data");

    await getEventsData("art", "OTHER", "Cairo", "", "", 1);

    const call = cacheCallLog[0];

    // Must have the broad tag for bulk invalidation …
    expect(call.tags).toContain("events-listing");

    // … AND a second, filter-scoped tag for targeted invalidation.
    const scopedTag = call.tags.find(
      (t) => t.startsWith("events-listing:") && t !== "events-listing",
    );
    expect(scopedTag).toBeDefined();
    expect(scopedTag).toMatch(/art.*OTHER.*Cairo/);
  });
});

describe("cache freshness after mutation (revalidateTag contract)", () => {
  it("a second call with identical filters re-uses the same cache-key array", async () => {
    const { getEventsData } = await import("@/lib/events-data");

    await getEventsData("sports", "SPORTS", "Kampala", "", "", 1);
    await getEventsData("sports", "SPORTS", "Kampala", "", "", 1);

    // Both calls must register with identical keys, confirming the cache would
    // serve the same slot (and therefore a single revalidateTag clears both reads).
    expect(cacheCallLog[0].keys).toEqual(cacheCallLog[1].keys);
    expect(cacheCallLog[0].tags).toEqual(cacheCallLog[1].tags);
  });
});

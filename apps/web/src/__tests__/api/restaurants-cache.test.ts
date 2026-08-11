/**
 * Tests for restaurants-listing cache behaviour in apps/web/src/lib/restaurants-data.ts
 *
 * This file uses `export {}` to be treated as an ES module, preventing
 * top-level variable declarations from colliding with other test files.
 *
 * Covers:
 *  - Two different filter combinations produce distinct cache-key arrays so they
 *    are stored as separate entries and never collide.
 *  - Every cache entry is tagged with the broad "restaurants-listing" tag so a
 *    single revalidateTag("restaurants-listing") call (fired after publish /
 *    delete) wipes all filter variants at once.
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
const mockCount    = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    restaurant: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count:    (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Prisma client types are imported transitively; stub it out.
jest.mock("@prisma/client", () => ({
  PrismaClient: jest.fn(),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Return the cache call that matches the given filter parameters. */
function callFor(q: string, city: string, cuisine: string): CacheCall | undefined {
  return cacheCallLog.find(
    (c) => c.keys[1] === q && c.keys[2] === city && c.keys[3] === cuisine,
  );
}

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  cacheCallLog.length = 0;
  jest.resetModules();

  // findMany is called four times per getRestaurantsData invocation:
  // restaurants list, city distinct, cuisine distinct (and count separately).
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("restaurants-listing cache key isolation", () => {
  it("uses distinct cache-key arrays for two different filter combinations", async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    await getRestaurantsData("italian", "Nairobi", "Italian", 1);
    await getRestaurantsData("burger",  "Lagos",   "American", 1);

    const call1 = callFor("italian", "Nairobi", "Italian");
    const call2 = callFor("burger",  "Lagos",   "American");

    expect(call1).toBeDefined();
    expect(call2).toBeDefined();

    // Key arrays must differ so the two results occupy separate cache slots.
    expect(call1!.keys).not.toEqual(call2!.keys);
  });

  it("gives each filter combination a unique per-filter cache tag", async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    await getRestaurantsData("sushi", "Nairobi", "Japanese", 1);
    await getRestaurantsData("sushi", "Accra",   "Japanese", 1);

    const call1 = callFor("sushi", "Nairobi", "Japanese");
    const call2 = callFor("sushi", "Accra",   "Japanese");

    // The per-filter tag encodes every parameter; city difference must be visible.
    const filterTag1 = call1!.tags.find((t) => t.startsWith("restaurants-listing:"));
    const filterTag2 = call2!.tags.find((t) => t.startsWith("restaurants-listing:"));

    expect(filterTag1).toBeDefined();
    expect(filterTag2).toBeDefined();
    expect(filterTag1).not.toBe(filterTag2);
  });

  it("page number is included in the cache key so page 1 and page 2 are separate entries", async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    await getRestaurantsData("", "", "", 1);
    await getRestaurantsData("", "", "", 2);

    const callP1 = cacheCallLog.find((c) => c.keys[4] === "1");
    const callP2 = cacheCallLog.find((c) => c.keys[4] === "2");

    expect(callP1).toBeDefined();
    expect(callP2).toBeDefined();
    expect(callP1!.keys).not.toEqual(callP2!.keys);
  });
});

describe("restaurants-listing broad revalidation tag", () => {
  it('every cache entry carries the "restaurants-listing" tag so revalidateTag wipes all variants', async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    // Simulate several different filter combinations a visitor might request.
    const filterSets: [string, string, string, number][] = [
      ["",        "",        "",          1],
      ["italian", "Nairobi", "Italian",   1],
      ["burger",  "Lagos",   "American",  2],
      ["seafood", "Accra",   "African",   1],
    ];

    for (const args of filterSets) {
      await getRestaurantsData(...args);
    }

    expect(cacheCallLog).toHaveLength(filterSets.length);

    // Every single entry must include the broad tag so one revalidateTag call
    // is sufficient to bust the entire listing cache after a publish or delete.
    for (const call of cacheCallLog) {
      expect(call.tags).toContain("restaurants-listing");
    }
  });

  it('each entry also carries a unique per-filter tag alongside "restaurants-listing"', async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    await getRestaurantsData("tapas", "Cairo", "Spanish", 1);

    const call = cacheCallLog[0];

    // Must have the broad tag for bulk invalidation …
    expect(call.tags).toContain("restaurants-listing");

    // … AND a second, filter-scoped tag for targeted invalidation.
    // The scoped tag uses a hash to stay within Next.js tag length limits.
    const scopedTag = call.tags.find(
      (t) => t.startsWith("restaurants-listing:") && t !== "restaurants-listing",
    );
    expect(scopedTag).toBeDefined();
    // The scoped tag must be a non-empty string different from the broad tag.
    expect(scopedTag!.length).toBeGreaterThan("restaurants-listing:".length);
  });
});

describe("cache freshness after mutation (revalidateTag contract)", () => {
  it("a second call with identical filters re-uses the same cache-key array", async () => {
    const { getRestaurantsData } = await import("@/lib/restaurants-data");

    await getRestaurantsData("pizza", "Kampala", "Italian", 1);
    await getRestaurantsData("pizza", "Kampala", "Italian", 1);

    // Both calls must register with identical keys, confirming the cache would
    // serve the same slot (and therefore a single revalidateTag clears both reads).
    expect(cacheCallLog[0].keys).toEqual(cacheCallLog[1].keys);
    expect(cacheCallLog[0].tags).toEqual(cacheCallLog[1].tags);
  });
});

export {};

/**
 * UI tests for the restaurants page empty-state behaviour.
 *
 * Covers two distinct scenarios by exercising the real RestaurantsContent
 * server component (exported from page.tsx) with a stubbed Prisma client:
 *
 *  1. Zero published restaurants, no filters active → "No restaurants listed yet"
 *     card with a "List your restaurant" CTA link (partner acquisition prompt).
 *     Verifies the Prisma query filters by published: true.
 *
 *  2. Filters are active but return no matches → RestaurantGrid renders the
 *     "No restaurants found / Try adjusting…" filter-mismatch message instead.
 */

import "@testing-library/jest-dom";
import React from "react";
import { render, screen } from "@testing-library/react";

// ── Mocks (must precede all static imports of the modules being mocked) ───────

// next/cache: pass the wrapped function straight through so getRestaurantsData
// runs against the mocked Prisma client instead of hitting a real cache.
jest.mock("next/cache", () => ({
  unstable_cache: (fn: (...a: unknown[]) => unknown) => fn,
  revalidateTag: jest.fn(),
}));

// next/link: render a plain <a> so role="link" queries work in jsdom.
jest.mock("next/link", () => {
  const MockLink = ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => React.createElement("a", { href, className }, children);
  MockLink.displayName = "MockLink";
  return MockLink;
});

// next/navigation: used by RestaurantFilterSidebar internally.
jest.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
  useRouter: () => ({ push: jest.fn() }),
  usePathname: () => "/restaurants",
}));

// Prisma stub – behaviour controlled per-test via mockResolvedValue.
const mockFindMany = jest.fn();
const mockCount = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    restaurant: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      count: (...args: unknown[]) => mockCount(...args),
    },
  },
}));

// Heavy sub-components not under test – prevent them from making real requests.
jest.mock("@/components/layout/NavBar", () => ({
  NavBar: () => React.createElement("nav", null, "NavBar"),
}));
jest.mock("@/components/restaurants/RestaurantFilterSidebar", () => ({
  RestaurantFilterSidebar: () => React.createElement("aside", null, "Filters"),
}));
jest.mock("@/components/events/SearchBar", () => ({
  SearchBar: () => React.createElement("div", null, "SearchBar"),
}));
jest.mock("@/components/events/ShareLinkButton", () => ({
  ShareLinkButton: () => null,
}));

// Static import must come after all jest.mock() calls so the mocks are in place
// when Next.js page module-level code (unstable_cache) executes.
// eslint-disable-next-line import/first
import { RestaurantsContent } from "@/app/restaurants/page";
// eslint-disable-next-line import/first
import { RestaurantGrid } from "@/components/restaurants/RestaurantGrid";

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Invoke the real async server component and render its returned JSX.
 * searchParams matches the Next.js 15 convention where the prop is a Promise.
 */
async function renderContent(params: Record<string, string> = {}) {
  const jsx = await RestaurantsContent({
    searchParams: Promise.resolve(params),
  });
  render(jsx as React.ReactElement);
}

/** Default empty stub for the distinct-city / distinct-cuisine queries. */
function stubEmptyDistinctQueries() {
  // findMany is called 3 times per render:
  //  1. paginated restaurant list
  //  2. distinct cities
  //  3. distinct cuisines
  // mockFindMany.mockResolvedValue([]) covers all three.
  mockFindMany.mockResolvedValue([]);
  mockCount.mockResolvedValue(0);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("RestaurantsContent — empty-state rendering", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ── Scenario 1: Zero published restaurants, no active filters ──────────────

  describe("when there are no published restaurants and no filters are active", () => {
    beforeEach(stubEmptyDistinctQueries);

    it('renders the "No restaurants listed yet" heading', async () => {
      await renderContent({});
      expect(
        screen.getByRole("heading", { name: /no restaurants listed yet/i }),
      ).toBeInTheDocument();
    });

    it("renders the partner acquisition description", async () => {
      await renderContent({});
      expect(
        screen.getByText(/we're growing our restaurant directory/i),
      ).toBeInTheDocument();
    });

    it('renders a "List your restaurant" link pointing to the registration page', async () => {
      await renderContent({});
      const link = screen.getByRole("link", { name: /list your restaurant/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute("href", "/auth/register");
    });

    it('does NOT render the filter-mismatch message', async () => {
      await renderContent({});
      expect(
        screen.queryByText(/try adjusting your search or filters/i),
      ).not.toBeInTheDocument();
    });

    it("queries Prisma with published: true", async () => {
      await renderContent({});
      // All findMany calls (list, cities, cuisines) must include published: true.
      expect(mockFindMany).toHaveBeenCalled();
      for (const call of mockFindMany.mock.calls) {
        const whereArg = call[0]?.where;
        expect(whereArg).toMatchObject({ published: true });
      }
    });
  });

  // ── Scenario 2: Filters active, no matching restaurants ───────────────────

  describe("when filters are active but no restaurants match", () => {
    beforeEach(stubEmptyDistinctQueries);

    it('renders the "No restaurants found" heading when a city filter is active', async () => {
      await renderContent({ city: "Nairobi" });
      expect(
        screen.getByRole("heading", { name: /no restaurants found/i }),
      ).toBeInTheDocument();
    });

    it('renders the "Try adjusting your search or filters" hint when a cuisine filter is active', async () => {
      await renderContent({ cuisine: "Italian" });
      expect(
        screen.getByText(/try adjusting your search or filters/i),
      ).toBeInTheDocument();
    });

    it('renders the filter-mismatch message when a search query is active', async () => {
      await renderContent({ q: "sushi" });
      expect(
        screen.getByRole("heading", { name: /no restaurants found/i }),
      ).toBeInTheDocument();
    });

    it('does NOT render the "No restaurants listed yet" heading when filters are active', async () => {
      await renderContent({ city: "Lagos" });
      expect(
        screen.queryByRole("heading", { name: /no restaurants listed yet/i }),
      ).not.toBeInTheDocument();
    });

    it('does NOT render the "List your restaurant" CTA link when filters are active', async () => {
      await renderContent({ cuisine: "Thai" });
      expect(
        screen.queryByRole("link", { name: /list your restaurant/i }),
      ).not.toBeInTheDocument();
    });
  });
});

// ── Unit tests for RestaurantGrid in isolation ────────────────────────────────

describe("RestaurantGrid — empty-state rendering", () => {
  it('shows "No restaurants found" when the restaurants array is empty', () => {
    render(React.createElement(RestaurantGrid, { restaurants: [] }));
    expect(
      screen.getByRole("heading", { name: /no restaurants found/i }),
    ).toBeInTheDocument();
  });

  it('shows the "Try adjusting your search or filters" hint when empty', () => {
    render(React.createElement(RestaurantGrid, { restaurants: [] }));
    expect(
      screen.getByText(/try adjusting your search or filters/i),
    ).toBeInTheDocument();
  });

  it("renders restaurant cards and hides the empty state when results exist", () => {
    const fakeRestaurant = {
      id: "r1",
      name: "Test Bistro",
      slug: "test-bistro",
      description: "A test restaurant",
      city: "Accra",
      address: "1 Test St",
      cuisine: "African",
      priceRange: "$$",
      coverImage: null,
      avgRating: null,
      amenities: [],
      _count: { reviews: 0, menuItems: 0 },
      partner: { id: "p1", name: "Partner" },
      published: true,
      partnerId: "p1",
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    render(React.createElement(RestaurantGrid, { restaurants: [fakeRestaurant as any] }));
    expect(
      screen.queryByRole("heading", { name: /no restaurants found/i }),
    ).not.toBeInTheDocument();
  });
});

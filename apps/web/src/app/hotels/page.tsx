import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGrid } from "@/components/hotels/HotelGrid";
import { HotelFilterSidebar } from "@/components/hotels/HotelFilterSidebar";
import { HotelSortBar } from "@/components/hotels/HotelSortBar";
import { SearchBar } from "@/components/events/SearchBar";
import { ShareLinkButton } from "@/components/events/ShareLinkButton";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

// Cache identical filter combinations for 60 s.
const getHotelsData = unstable_cache(
  async (q: string, city: string, stars: number, amenities: string[], sort: string, page: number) => {
    const orderBy =
      sort === "stars_desc" ? [{ starRating: "desc" as const }, { name: "asc" as const }]
      : sort === "stars_asc" ? [{ starRating: "asc" as const }, { name: "asc" as const }]
      : sort === "newest"   ? { createdAt: "desc" as const }
      : { name: "asc" as const };

    const where = {
      published: true,
      ...(q && {
        OR: [
          { name:        { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location:    { contains: q, mode: "insensitive" as const } },
          { city:        { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(city      && { city:       { contains: city, mode: "insensitive" as const } }),
      ...(stars > 0 && { starRating: stars }),
      ...(amenities.length > 0 && { amenities: { hasEvery: amenities } }),
    };

    const [hotels, total, cityRows] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: {
          partner: { select: { id: true, name: true } },
          rooms:   { select: { price: true, currency: true }, orderBy: { price: "asc" } },
          _count:  { select: { rooms: true, reviews: true, bookings: true } },
          reviews: { select: { rating: true } },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: orderBy as any,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where:    { published: true },
        select:   { city: true },
        distinct: ["city"],
        orderBy:  { city: "asc" },
      }),
    ]);
    return { hotels, total, cities: cityRows.map((r) => r.city).filter(Boolean) };
  },
  ["hotels-listing"],
  { revalidate: 60, tags: ["hotels-listing"] }
);

interface PageProps {
  searchParams: Promise<{
    q?: string;
    city?: string;
    stars?: string;
    amenities?: string;
    sort?: string;
    page?: string;
  }>;
}

// ── Active-filter chips (server-rendered) ────────────────────────────────────

function ActiveFilterChips({
  city,
  stars,
  amenities,
  baseHref,
}: {
  city: string;
  stars: number | null;
  amenities: string[];
  baseHref: (overrides: Record<string, string>) => string;
}) {
  const chips: { label: string; removeHref: string }[] = [];

  if (city) chips.push({ label: `City: ${city}`, removeHref: baseHref({ city: "" }) });
  if (stars) chips.push({ label: `${stars}★`, removeHref: baseHref({ stars: "" }) });
  amenities.forEach((a) =>
    chips.push({
      label: a,
      removeHref: baseHref({
        amenities: amenities.filter((x) => x !== a).join(","),
      }),
    })
  );

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mb-4">
      {chips.map(({ label, removeHref }) => (
        <Link
          key={label}
          href={removeHref}
          className="inline-flex items-center gap-1.5 bg-orange-50 text-orange-700 border border-orange-100 text-xs font-medium px-3 py-1 rounded-full hover:bg-orange-100 transition"
        >
          {label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </Link>
      ))}
    </div>
  );
}

// ── Main content (async server component) ────────────────────────────────────

async function HotelsContent({ searchParams }: PageProps) {
  const sp        = await searchParams;
  const q         = sp.q?.trim() ?? "";
  const city      = sp.city?.trim() ?? "";
  const stars     = sp.stars ? Number(sp.stars) : null;
  const amenities = sp.amenities?.split(",").filter(Boolean) ?? [];
  const sort      = sp.sort ?? "name";
  const page      = Math.max(1, Number(sp.page ?? "1"));

  const { hotels, total, cities } = await getHotelsData(q, city, stars ?? 0, amenities, sort, page);

  const hotelsWithRating = hotels.map((h) => {
    const ratings  = h.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    const { reviews: _r, ...rest } = h;
    return { ...rest, avgRating };
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = !!(q || city || stars || amenities.length > 0);

  function buildHref(overrides: Record<string, string>): string {
    const merged = {
      ...(q         ? { q }                      : {}),
      ...(city      ? { city }                   : {}),
      ...(stars     ? { stars: String(stars) }   : {}),
      ...(amenities.length > 0 ? { amenities: amenities.join(",") } : {}),
      ...(sort !== "name" ? { sort }             : {}),
      ...overrides,
    };
    // Remove empty-string overrides
    (Object.keys(merged) as (keyof typeof merged)[]).forEach((k) => { if (!merged[k]) delete merged[k]; });
    const qs = new URLSearchParams(merged).toString();
    return `/hotels${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Sidebar */}
      <Suspense>
        <HotelFilterSidebar cities={cities} />
      </Suspense>

      {/* Main column */}
      <div className="flex-1 min-w-0">
        {/* Active-filter chips */}
        <ActiveFilterChips city={city} stars={stars} amenities={amenities} baseHref={buildHref} />

        {/* Sort bar + share */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <Suspense fallback={<div className="h-9 bg-gray-100 rounded-lg animate-pulse flex-1" />}>
            <HotelSortBar total={total} hasFilters={hasFilters} />
          </Suspense>
          <Suspense>
            <ShareLinkButton filterParams={["q", "city", "stars", "amenities"]} />
          </Suspense>
        </div>

        {/* Grid */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <HotelGrid
          hotels={hotelsWithRating as any}
          emptyMessage={
            hasFilters
              ? "Try adjusting your search or filters."
              : "Be the first to list your property and reach travellers across Africa."
          }
          emptyAction={
            !hasFilters ? (
              <Link
                href="/partner"
                className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
              >
                List your property
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ) : undefined
          }
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link
                href={buildHref({ page: String(page - 1) })}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                ← Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <Link
                  key={p}
                  href={buildHref({ page: String(p) })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
                    p === page
                      ? "bg-orange-600 text-white"
                      : "border border-gray-200 text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  {p}
                </Link>
              ))}
            {page < totalPages && (
              <Link
                href={buildHref({ page: String(page + 1) })}
                className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 transition"
              >
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Page export ──────────────────────────────────────────────────────────────

export default function HotelsPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Hotels</h1>
          <p className="text-gray-500 mb-6">Discover exceptional stays across Africa</p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar skeleton */}
              <div className="w-full lg:w-56 flex-shrink-0">
                <div className="h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              </div>
              {/* Grid skeleton */}
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-72 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <HotelsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

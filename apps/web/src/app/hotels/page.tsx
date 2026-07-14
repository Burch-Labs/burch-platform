import { Suspense } from "react";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGrid } from "@/components/hotels/HotelGrid";
import { HotelFilterSidebar } from "@/components/hotels/HotelFilterSidebar";
import { SearchBar } from "@/components/events/SearchBar";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string; stars?: string; page?: string }>;
}

async function HotelsContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.city?.trim() ?? "";
  const stars = sp.stars ? Number(sp.stars) : null;
  const page = Math.max(1, Number(sp.page ?? "1"));

  const where = {
    published: true,
    ...(q && {
      OR: [
        { name: { contains: q, mode: "insensitive" as const } },
        { description: { contains: q, mode: "insensitive" as const } },
        { location: { contains: q, mode: "insensitive" as const } },
        { city: { contains: q, mode: "insensitive" as const } },
      ],
    }),
    ...(city && { city: { contains: city, mode: "insensitive" as const } }),
    ...(stars && { starRating: stars }),
  };

  const [hotels, total, cityRows] = await Promise.all([
    prisma.hotel.findMany({
      where,
      include: {
        partner: { select: { id: true, name: true } },
        rooms: { select: { price: true, currency: true }, orderBy: { price: "asc" } },
        _count: { select: { rooms: true, reviews: true, bookings: true } },
        reviews: { select: { rating: true } },
      },
      orderBy: { name: "asc" },
      take: PAGE_SIZE,
      skip: (page - 1) * PAGE_SIZE,
    }),
    prisma.hotel.count({ where }),
    prisma.hotel.findMany({
      where: { published: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    }),
  ]);

  const hotelsWithRating = hotels.map((h) => {
    const ratings = h.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    const { reviews: _reviews, ...rest } = h;
    return { ...rest, avgRating };
  });

  const cities = cityRows.map((r) => r.city).filter(Boolean);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = q || city || stars;

  return (
    <div className="flex gap-6 items-start">
      <Suspense>
        <HotelFilterSidebar cities={cities} />
      </Suspense>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {total === 0
              ? "No hotels found"
              : `${total} hotel${total !== 1 ? "s" : ""}${hasFilters ? " matching your filters" : ""}`}
          </p>
          {page > 1 && (
            <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
          )}
        </div>

        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <HotelGrid hotels={hotelsWithRating as any} />

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <PaginationLink href={buildHref(sp, page - 1)} label="← Previous" />
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1)
              .filter((p) => Math.abs(p - page) <= 2)
              .map((p) => (
                <PaginationLink
                  key={p}
                  href={buildHref(sp, p)}
                  label={String(p)}
                  active={p === page}
                />
              ))}
            {page < totalPages && (
              <PaginationLink href={buildHref(sp, page + 1)} label="Next →" />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationLink({ href, label, active }: { href: string; label: string; active?: boolean }) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active ? "bg-orange-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(sp: Record<string, string | undefined>, page: number): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.city) params.set("city", sp.city);
  if (sp.stars) params.set("stars", sp.stars);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/hotels${qs ? `?${qs}` : ""}`;
}

export default function HotelsPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Hotels</h1>
          <p className="text-gray-500 mb-6">
            Discover exceptional stays across Africa
          </p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="flex gap-6">
              <div className="w-56 h-96 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              <div className="flex-1 grid grid-cols-3 gap-5">
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

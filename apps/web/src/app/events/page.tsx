import { Suspense } from "react";
import { unstable_cache } from "next/cache";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/layout/NavBar";
import { EventGrid } from "@/components/events/EventGrid";
import { FilterSidebar } from "@/components/events/FilterSidebar";
import { SearchBar } from "@/components/events/SearchBar";
import { SaveSearchButton } from "@/components/events/SaveSearchButton";
import { prisma } from "@/lib/prisma";
import { EventCategory } from "@prisma/client";
import Link from "next/link";

const PAGE_SIZE = 12;

// Cache identical filter combinations for 60 s — safe since formatDate/formatCurrency
// both accept strings, which is what JSON serialisation produces from Date/Decimal.
const getEventsData = unstable_cache(
  async (
    q: string,
    category: string,
    city: string,
    dateFrom: string,
    dateTo: string,
    page: number
  ) => {
    // Build the startDate constraint: respect user-supplied bounds but always
    // fall back to "now" as the lower bound so past events are never shown.
    const now = new Date();
    const fromDate = dateFrom ? new Date(dateFrom) : null;
    const toDate = dateTo
      ? (() => {
          // Use end-of-day for the "to" date so events on that day are included
          const d = new Date(dateTo);
          d.setHours(23, 59, 59, 999);
          return d;
        })()
      : null;

    const startDateFilter: { gte?: Date; lte?: Date } = {
      gte: fromDate && fromDate > now ? fromDate : now,
    };
    if (toDate) startDateFilter.lte = toDate;

    const where = {
      published: true,
      startDate: startDateFilter,
      ...(q && {
        OR: [
          { title:       { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location:    { contains: q, mode: "insensitive" as const } },
          { city:        { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category: category as EventCategory }),
      ...(city && { city: { contains: city, mode: "insensitive" as const } }),
    };
    const [events, total, cityRows] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          partner: {
            select: {
              id: true, name: true, logoUrl: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
          _count: { select: { bookings: true } },
        },
        orderBy: { startDate: "asc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.event.count({ where }),
      prisma.event.findMany({
        where: { published: true },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
    ]);
    return { events, total, cities: cityRows.map((r) => r.city).filter(Boolean) };
  },
  ["events-listing"],
  { revalidate: 60 }
);

interface PageProps {
  searchParams: Promise<{
    q?: string;
    category?: string;
    city?: string;
    dateFrom?: string;
    dateTo?: string;
    page?: string;
  }>;
}

async function EventsContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const category = (sp.category as EventCategory) || undefined;
  const city = sp.city?.trim() ?? "";
  const dateFrom = sp.dateFrom?.trim() ?? "";
  const dateTo = sp.dateTo?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1"));

  const [{ events, total, cities }, session] = await Promise.all([
    getEventsData(q, category ?? "", city, dateFrom, dateTo, page),
    getServerSession(authOptions),
  ]);
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = q || category || city || dateFrom || dateTo;

  return (
    <div className="flex gap-6 items-start">
      {/* Sidebar */}
      <Suspense>
        <FilterSidebar cities={cities} />
      </Suspense>

      {/* Main */}
      <div className="flex-1 min-w-0">
        {/* Results header */}
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {total === 0
              ? "No events found"
              : `${total} event${total !== 1 ? "s" : ""}${hasFilters ? " matching your filters" : ""}`}
          </p>
          <div className="flex items-center gap-4">
            <Suspense>
              <SaveSearchButton isLoggedIn={!!session} />
            </Suspense>
            {page > 1 && (
              <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>
            )}
          </div>
        </div>

        {/* Grid */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        <EventGrid events={events as any} />

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <PaginationLink
                href={buildHref(sp, page - 1)}
                label="← Previous"
              />
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
              <PaginationLink
                href={buildHref(sp, page + 1)}
                label="Next →"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function PaginationLink({
  href,
  label,
  active,
}: {
  href: string;
  label: string;
  active?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`px-4 py-2 rounded-lg text-sm font-medium transition ${
        active
          ? "bg-orange-600 text-white"
          : "border border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {label}
    </Link>
  );
}

function buildHref(
  sp: Record<string, string | undefined>,
  page: number
): string {
  const params = new URLSearchParams();
  if (sp.q) params.set("q", sp.q);
  if (sp.category) params.set("category", sp.category);
  if (sp.city) params.set("city", sp.city);
  if (sp.dateFrom) params.set("dateFrom", sp.dateFrom);
  if (sp.dateTo) params.set("dateTo", sp.dateTo);
  if (page > 1) params.set("page", String(page));
  const qs = params.toString();
  return `/events${qs ? `?${qs}` : ""}`;
}

export default function EventsPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Discover Events</h1>
          <p className="text-gray-500 mb-6">
            Find the best events happening across Africa
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
                  <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <EventsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

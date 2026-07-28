/**
 * Cache-backed data fetcher for the public events listing.
 *
 * Extracted into its own module (no JSX) so it can be unit-tested independently
 * of the React page component.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";
import { EventCategory } from "@prisma/client";

const PAGE_SIZE = 12;

// Cache each unique filter combination independently for 60 s.
// The key parts include every filter param so different combinations never
// share a cache entry and can be revalidated independently.
// The broad "events-listing" tag is present on every entry so that a single
// revalidateTag("events-listing") call — fired after a publish or cancel —
// wipes all filter variants at once.
export function getEventsData(
  q: string,
  category: string,
  city: string,
  dateFrom: string,
  dateTo: string,
  page: number,
) {
  // Build a stable cache tag scoped to this exact filter combination so that
  // revalidation (e.g. after an event mutation) can target only affected entries.
  const filterTag = `events-listing:${q}:${category}:${city}:${dateFrom}:${dateTo}:${page}`;

  return unstable_cache(
    async () => {
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
    // Key parts encode the full filter state so each combination is cached separately.
    ["events-listing", q, category, city, dateFrom, dateTo, String(page)],
    { revalidate: 60, tags: ["events-listing", filterTag] },
  )();
}

export { PAGE_SIZE };

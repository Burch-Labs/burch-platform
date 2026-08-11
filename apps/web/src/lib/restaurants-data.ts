/**
 * Cache-backed data fetcher for the public restaurants listing.
 *
 * Extracted into its own module (no JSX) so it can be unit-tested independently
 * of the React page component.
 */

import { unstable_cache } from "next/cache";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

// Cache each unique filter combination independently for 60 s.
// The key parts include every filter param so different combinations never
// share a cache entry and can be revalidated independently.
// The broad "restaurants-listing" tag is present on every entry so that a single
// revalidateTag("restaurants-listing") call — fired after a publish or delete —
// wipes all filter variants at once.
/**
 * Produce a bounded cache tag for a filter combination.
 * Raw query values can be arbitrarily long; Next.js cache tags have a length
 * limit, so we fold the full filter tuple into a short stable hash instead of
 * interpolating the values directly.
 */
function filterHash(q: string, city: string, cuisine: string, page: number): string {
  const payload = `${q}|${city}|${cuisine}|${page}`;
  let h = 0;
  for (let i = 0; i < payload.length; i++) {
    h = (Math.imul(31, h) + payload.charCodeAt(i)) | 0;
  }
  return (h >>> 0).toString(36);
}

export function getRestaurantsData(
  q: string,
  city: string,
  cuisine: string,
  page: number,
) {
  // Build a stable cache tag scoped to this exact filter combination so that
  // revalidation (e.g. after a partner mutation) can target only affected entries.
  // The hash keeps the tag within Next.js's length limit regardless of query length.
  const filterTag = `restaurants-listing:${filterHash(q, city, cuisine, page)}`;

  return unstable_cache(
    async () => {
      const where = {
        published: true,
        ...(q && {
          OR: [
            { name:        { contains: q, mode: "insensitive" as const } },
            { description: { contains: q, mode: "insensitive" as const } },
            { cuisine:     { contains: q, mode: "insensitive" as const } },
            { city:        { contains: q, mode: "insensitive" as const } },
          ],
        }),
        ...(city    && { city:    { contains: city,    mode: "insensitive" as const } }),
        ...(cuisine && { cuisine: { contains: cuisine, mode: "insensitive" as const } }),
      };

      const [restaurants, total, cityRows, cuisineRows] = await Promise.all([
        prisma.restaurant.findMany({
          where,
          include: {
            partner: { select: { id: true, name: true } },
            reviews: { select: { rating: true } },
            _count:  { select: { reviews: true, menuItems: true } },
          },
          orderBy: { name: "asc" },
          take: PAGE_SIZE,
          skip: (page - 1) * PAGE_SIZE,
        }),
        prisma.restaurant.count({ where }),
        prisma.restaurant.findMany({
          where: { published: true },
          select: { city: true },
          distinct: ["city"],
          orderBy: { city: "asc" },
        }),
        prisma.restaurant.findMany({
          where: { published: true, cuisine: { not: null } },
          select: { cuisine: true },
          distinct: ["cuisine"],
          orderBy: { cuisine: "asc" },
        }),
      ]);

      return {
        restaurants,
        total,
        cities:   cityRows.map((r) => r.city).filter(Boolean),
        cuisines: cuisineRows.map((r) => r.cuisine).filter(Boolean) as string[],
      };
    },
    // Key parts encode the full filter state so each combination is cached separately.
    ["restaurants-listing", q, city, cuisine, String(page)],
    { revalidate: 60, tags: ["restaurants-listing", filterTag] },
  )();
}

export { PAGE_SIZE };

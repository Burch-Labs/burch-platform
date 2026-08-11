import { Suspense } from "react";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { RestaurantGrid } from "@/components/restaurants/RestaurantGrid";
import { RestaurantFilterSidebar } from "@/components/restaurants/RestaurantFilterSidebar";
import { SearchBar } from "@/components/events/SearchBar";
import { ShareLinkButton } from "@/components/events/ShareLinkButton";
import { EmptyState } from "@/components/ui/EmptyState";
import { getRestaurantsData, PAGE_SIZE } from "@/lib/restaurants-data";

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string; cuisine?: string; page?: string }>;
}

export async function RestaurantsContent({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.city?.trim() ?? "";
  const cuisine = sp.cuisine?.trim() ?? "";
  const page = Math.max(1, Number(sp.page ?? "1"));

  const { restaurants, total, cities, cuisines } = await getRestaurantsData(q, city, cuisine, page);

  const withRating = restaurants.map((r) => {
    const ratings = r.reviews.map((rv) => rv.rating);
    const avgRating = ratings.length > 0 ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null;
    const { reviews: _, ...rest } = r;
    return { ...rest, avgRating };
  });

  const totalPages = Math.ceil(total / PAGE_SIZE);
  const hasFilters = q || city || cuisine;

  function buildHref(overrides: Record<string, string | undefined>) {
    const merged = { ...(q ? { q } : {}), ...(city ? { city } : {}), ...(cuisine ? { cuisine } : {}), ...overrides };
    const params = new URLSearchParams(merged as Record<string, string>);
    const qs = params.toString();
    return `/restaurants${qs ? `?${qs}` : ""}`;
  }

  return (
    <div className="flex gap-6 items-start">
      <Suspense>
        <RestaurantFilterSidebar cities={cities} cuisines={cuisines} />
      </Suspense>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-500">
            {total === 0 ? "No restaurants found" : `${total} restaurant${total !== 1 ? "s" : ""}${hasFilters ? " matching your filters" : ""}`}
          </p>
          <div className="flex items-center gap-4">
            <Suspense>
              <ShareLinkButton filterParams={["q", "city", "cuisine"]} />
            </Suspense>
            {totalPages > 1 && <p className="text-sm text-gray-400">Page {page} of {totalPages}</p>}
          </div>
        </div>

        {total === 0 && !hasFilters ? (
          <EmptyState
            emoji="🍽️"
            title="No restaurants listed yet"
            description="We're growing our restaurant directory. If you own a dining venue, join as a partner and add your listing today."
            action={
              <Link
                href="/auth/register"
                className="inline-block px-5 py-2.5 rounded-lg bg-orange-600 text-white text-sm font-medium hover:bg-orange-700 transition"
              >
                List your restaurant
              </Link>
            }
          />
        ) : (
          /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
          <RestaurantGrid restaurants={withRating as any} />
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-10">
            {page > 1 && (
              <Link href={buildHref({ page: String(page - 1) })} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                ← Previous
              </Link>
            )}
            {Array.from({ length: totalPages }, (_, i) => i + 1).filter((p) => Math.abs(p - page) <= 2).map((p) => (
              <Link
                key={p}
                href={buildHref({ page: String(p) })}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition ${p === page ? "bg-orange-600 text-white" : "border border-gray-200 text-gray-600 hover:bg-gray-50"}`}
              >
                {p}
              </Link>
            ))}
            {page < totalPages && (
              <Link href={buildHref({ page: String(page + 1) })} className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-600 hover:bg-gray-50">
                Next →
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestaurantsPage(props: PageProps) {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 py-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-1">Restaurants</h1>
          <p className="text-gray-500 mb-6">Discover the finest dining experiences across Africa</p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </div>
      <main className="max-w-6xl mx-auto px-6 py-8">
        <Suspense
          fallback={
            <div className="flex gap-6">
              <div className="w-56 h-80 bg-white rounded-2xl border border-gray-100 animate-pulse" />
              <div className="flex-1 grid grid-cols-3 gap-5">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                ))}
              </div>
            </div>
          }
        >
          <RestaurantsContent searchParams={props.searchParams} />
        </Suspense>
      </main>
    </div>
  );
}

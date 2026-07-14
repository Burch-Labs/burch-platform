"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface HotelFilterSidebarProps {
  cities: string[];
}

const STAR_OPTIONS = [5, 4, 3, 2, 1];

export function HotelFilterSidebar({ cities }: HotelFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCity = params.get("city") ?? "";
  const activeStars = params.get("stars") ? Number(params.get("stars")) : null;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  const hasFilters = activeCity || activeStars;

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {hasFilters && (
            <button onClick={clearAll} className="text-xs text-orange-600 hover:underline">
              Clear all
            </button>
          )}
        </div>

        {/* Star rating */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Star Rating
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setParam("stars", "")}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition",
                !activeStars ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"
              )}
            >
              All ratings
            </button>
            {STAR_OPTIONS.map((s) => (
              <button
                key={s}
                onClick={() => setParam("stars", activeStars === s ? "" : String(s))}
                className={cn(
                  "text-left text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-1.5",
                  activeStars === s ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                {"★".repeat(s)}
                <span className="text-xs text-gray-400 ml-1">{s}-star</span>
              </button>
            ))}
          </div>
        </div>

        {/* City */}
        {cities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              City
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setParam("city", "")}
                className={cn(
                  "text-left text-sm px-3 py-1.5 rounded-lg transition",
                  !activeCity ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                )}
              >
                All cities
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setParam("city", activeCity === city ? "" : city)}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-lg transition",
                    activeCity === city ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}

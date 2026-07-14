"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";

interface RestaurantFilterSidebarProps {
  cities: string[];
  cuisines: string[];
}

export function RestaurantFilterSidebar({ cities, cuisines }: RestaurantFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, start] = useTransition();

  const activeCity = params.get("city") ?? "";
  const activeCuisine = params.get("cuisine") ?? "";

  function set(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page");
    start(() => router.push(`${pathname}?${next.toString()}`));
  }

  const hasFilters = activeCity || activeCuisine;

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="bg-white rounded-2xl border border-gray-100 p-5 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {hasFilters && (
            <button onClick={() => start(() => router.push(pathname))} className="text-xs text-orange-600 hover:underline">
              Clear all
            </button>
          )}
        </div>

        {cuisines.length > 0 && (
          <div className="mb-5">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">Cuisine</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => set("cuisine", "")}
                className={cn("text-left text-sm px-3 py-1.5 rounded-lg transition", !activeCuisine ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50")}
              >
                All cuisines
              </button>
              {cuisines.map((c) => (
                <button
                  key={c}
                  onClick={() => set("cuisine", activeCuisine === c ? "" : c)}
                  className={cn("text-left text-sm px-3 py-1.5 rounded-lg transition", activeCuisine === c ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50")}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        )}

        {cities.length > 0 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">City</p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => set("city", "")}
                className={cn("text-left text-sm px-3 py-1.5 rounded-lg transition", !activeCity ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50")}
              >
                All cities
              </button>
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => set("city", activeCity === city ? "" : city)}
                  className={cn("text-left text-sm px-3 py-1.5 rounded-lg transition", activeCity === city ? "bg-orange-50 text-orange-700 font-medium" : "text-gray-600 hover:bg-gray-50")}
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

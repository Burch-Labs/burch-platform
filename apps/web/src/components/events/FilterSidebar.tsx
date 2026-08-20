"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { EventCategory } from "@prisma/client";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/events";
import { cn } from "@/lib/utils";

interface FilterSidebarProps {
  cities: string[];
}

const CATEGORIES = Object.values(EventCategory);

export function FilterSidebar({ cities }: FilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const activeCategory = params.get("category") ?? "";
  const activeCity = params.get("city") ?? "";
  const activeDateFrom = params.get("dateFrom") ?? "";
  const activeDateTo = params.get("dateTo") ?? "";

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) {
      next.set(key, value);
    } else {
      next.delete(key);
    }
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
  }

  const hasFilters = activeCategory || activeCity || activeDateFrom || activeDateTo;

  return (
    <aside className="w-full lg:w-56 flex-shrink-0">
      <div className="bg-surface rounded-2xl border border-gray-100 p-5 sticky top-20">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
          {hasFilters && (
            <button
              onClick={clearAll}
              className="text-xs text-orange-600 hover:underline"
            >
              Clear all
            </button>
          )}
        </div>

        {/* Date range */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Date range
          </p>
          <div className="flex flex-col gap-2">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">From</label>
              <input
                type="date"
                value={activeDateFrom}
                onChange={(e) => setParam("dateFrom", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">To</label>
              <input
                type="date"
                value={activeDateTo}
                min={activeDateFrom || undefined}
                onChange={(e) => setParam("dateTo", e.target.value)}
                className="w-full text-sm border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
              />
            </div>
          </div>
        </div>

        {/* Category */}
        <div className="mb-5">
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
            Category
          </p>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setParam("category", "")}
              className={cn(
                "text-left text-sm px-3 py-1.5 rounded-lg transition",
                !activeCategory
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              All categories
            </button>
            {CATEGORIES.map((cat) => {
              const colors = CATEGORY_COLORS[cat];
              const isActive = activeCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setParam("category", isActive ? "" : cat)}
                  className={cn(
                    "text-left text-sm px-3 py-1.5 rounded-lg transition flex items-center gap-2",
                    isActive
                      ? `${colors.bg} ${colors.text} font-medium`
                      : "text-gray-600 hover:bg-gray-50"
                  )}
                >
                  {CATEGORY_LABELS[cat]}
                </button>
              );
            })}
          </div>
        </div>

        {/* City */}
        {/* Hidden while every listing is in one city — a single-option filter
            filters nothing. Reappears automatically on city two. */}
        {cities.length > 1 && (
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
              City
            </p>
            <div className="flex flex-col gap-1">
              <button
                onClick={() => setParam("city", "")}
                className={cn(
                  "text-left text-sm px-3 py-1.5 rounded-lg transition",
                  !activeCity
                    ? "bg-orange-50 text-orange-700 font-medium"
                    : "text-gray-600 hover:bg-gray-50"
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
                    activeCity === city
                      ? "bg-orange-50 text-orange-700 font-medium"
                      : "text-gray-600 hover:bg-gray-50"
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

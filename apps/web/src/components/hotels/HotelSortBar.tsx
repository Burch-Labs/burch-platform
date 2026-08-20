"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { FEATURES } from "@/lib/features";

// Sorting by a classification the cards do not show would leave the reader no
// way to see why the order changed, so the star options come and go with the
// badge. The server still honours stars_desc/stars_asc if a URL carries one.
const SORT_OPTIONS = [
  { value: "name",       label: "Name (A–Z)"        },
  ...(FEATURES.starRating
    ? ([
        { value: "stars_desc", label: "Stars (5★ first)"     },
        { value: "stars_asc",  label: "Stars (budget first)" },
      ] as const)
    : []),
  { value: "newest",     label: "Newest first"       },
] as const;

interface HotelSortBarProps {
  total: number;
  hasFilters: boolean;
}

export function HotelSortBar({ total, hasFilters }: HotelSortBarProps) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const sort = (params.get("sort") ?? "name") as string;

  function handleSort(value: string) {
    const next = new URLSearchParams(params.toString());
    if (value && value !== "name") next.set("sort", value);
    else next.delete("sort");
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  return (
    // flex-1 matters: this sits inside a flex row, so without it the bar
    // shrinks to its content and justify-between has no space to distribute,
    // pushing the count and the Sort label together.
    <div className="flex flex-1 items-center justify-between gap-4">
      <p className={`text-sm transition-opacity ${isPending ? "opacity-50" : ""} text-gray-500`}>
        {total === 0
          ? "No hotels found"
          : `${total} hotel${total !== 1 ? "s" : ""}${hasFilters ? " matching your filters" : ""}`}
      </p>
      <div className="flex items-center gap-2">
        <label htmlFor="hotel-sort" className="text-xs text-gray-400 hidden sm:block">
          Sort:
        </label>
        <select
          id="hotel-sort"
          value={sort}
          onChange={(e) => handleSort(e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-surface focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

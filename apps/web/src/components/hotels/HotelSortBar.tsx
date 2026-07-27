"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";

const SORT_OPTIONS = [
  { value: "name",       label: "Name (A–Z)"        },
  { value: "stars_desc", label: "Stars (5★ first)"   },
  { value: "stars_asc",  label: "Stars (budget first)" },
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
    <div className="flex items-center justify-between mb-4">
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
          className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-orange-500 transition"
        >
          {SORT_OPTIONS.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

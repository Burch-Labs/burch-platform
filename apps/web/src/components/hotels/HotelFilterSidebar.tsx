"use client";

import { useState } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";

const STAR_OPTIONS = [5, 4, 3, 2, 1];

const FILTER_AMENITIES = [
  { label: "WiFi",            icon: "📶" },
  { label: "Swimming Pool",   icon: "🏊" },
  { label: "Gym",             icon: "💪" },
  { label: "Restaurant",      icon: "🍽️" },
  { label: "Bar",             icon: "🍸" },
  { label: "Spa",             icon: "💆" },
  { label: "Parking",         icon: "🅿️" },
  { label: "Airport Shuttle", icon: "🚌" },
  { label: "24h Front Desk",  icon: "🛎️" },
  { label: "Beach Access",    icon: "🏖️" },
  { label: "Room Service",    icon: "🛏️" },
  { label: "Business Center", icon: "💼" },
];

interface HotelFilterSidebarProps {
  cities: string[];
}

export function HotelFilterSidebar({ cities }: HotelFilterSidebarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [, startTransition] = useTransition();
  const [mobileOpen, setMobileOpen] = useState(false);

  const activeCity     = params.get("city") ?? "";
  const activeStars    = params.get("stars") ? Number(params.get("stars")) : null;
  const activeAmenities: string[] =
    params.get("amenities")?.split(",").filter(Boolean) ?? [];

  const totalActive =
    (activeCity ? 1 : 0) + (activeStars ? 1 : 0) + activeAmenities.length;

  function setParam(key: string, value: string) {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function toggleAmenity(amenity: string) {
    const next = new URLSearchParams(params.toString());
    const current = next.get("amenities")?.split(",").filter(Boolean) ?? [];
    const updated = current.includes(amenity)
      ? current.filter((a) => a !== amenity)
      : [...current, amenity];
    if (updated.length > 0) next.set("amenities", updated.join(","));
    else next.delete("amenities");
    next.delete("page");
    startTransition(() => router.push(`${pathname}?${next.toString()}`));
  }

  function clearAll() {
    startTransition(() => router.push(pathname));
    setMobileOpen(false);
  }

  const body = (
    <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-900">Filters</h3>
        {totalActive > 0 && (
          <button onClick={clearAll} className="text-xs text-orange-600 hover:underline">
            Clear all
          </button>
        )}
      </div>

      {/* ── Star rating ────────────────────────────────────── */}
      {FEATURES.starRating && (
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Star Rating
        </p>
        <div className="flex flex-col gap-0.5">
          <button
            onClick={() => setParam("stars", "")}
            className={cn(
              "text-left text-sm px-3 py-1.5 rounded-lg transition",
              !activeStars
                ? "bg-orange-50 text-orange-700 font-medium"
                : "text-gray-600 hover:bg-gray-50"
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
                activeStars === s
                  ? "bg-orange-50 text-orange-700 font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              )}
            >
              <span className="text-amber-400 text-xs tracking-tight">{"★".repeat(s)}</span>
              <span className="text-xs text-gray-400">{s}-star</span>
            </button>
          ))}
        </div>
      </div>
      )}

      {/* ── City ───────────────────────────────────────────── */}
      {/* Hidden while every listing is in one city — a filter with a single
          option filters nothing. Reappears automatically on city two. */}
      {cities.length > 1 && (
        <div>
          <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
            City
          </p>
          <div className="flex flex-col gap-0.5">
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

      {/* ── Amenities ──────────────────────────────────────── */}
      <div>
        <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-2">
          Amenities
        </p>
        <div className="flex flex-col gap-0.5">
          {FILTER_AMENITIES.map(({ label, icon }) => {
            const checked = activeAmenities.includes(label);
            return (
              <label
                key={label}
                className={cn(
                  "flex items-center gap-2.5 px-3 py-1.5 rounded-lg cursor-pointer transition text-sm select-none",
                  checked
                    ? "bg-orange-50 text-orange-700"
                    : "text-gray-600 hover:bg-gray-50"
                )}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggleAmenity(label)}
                  className="w-3.5 h-3.5 accent-orange-600 flex-shrink-0"
                />
                <span className="text-sm leading-none">{icon}</span>
                <span className="truncate">{label}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );

  return (
    <aside className="flex-shrink-0 lg:w-56 w-full">
      {/* ── Mobile toggle ──────────────────────────────────── */}
      <div className="lg:hidden mb-4">
        <button
          onClick={() => setMobileOpen((v) => !v)}
          className="flex items-center justify-between w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-gray-700"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L13 13.414V19a1 1 0 01-.553.894l-4 2A1 1 0 017 21v-7.586L3.293 6.707A1 1 0 013 6V4z" />
            </svg>
            <span>Filters</span>
            {totalActive > 0 && (
              <span className="bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {totalActive}
              </span>
            )}
          </div>
          <svg
            className={cn("w-4 h-4 text-gray-400 transition-transform", mobileOpen && "rotate-180")}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {mobileOpen && <div className="mt-3">{body}</div>}
      </div>

      {/* ── Desktop: always visible, sticky ─────────────────── */}
      <div className="hidden lg:block sticky top-20">
        {body}
      </div>
    </aside>
  );
}

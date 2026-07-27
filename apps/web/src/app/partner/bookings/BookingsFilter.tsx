"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useCallback } from "react";

const STATUSES = [
  { value: "", label: "All statuses" },
  { value: "PENDING",   label: "Pending" },
  { value: "CONFIRMED", label: "Confirmed" },
  { value: "CANCELLED", label: "Cancelled" },
  { value: "COMPLETED", label: "Completed" },
];

interface Property {
  id: string;
  name: string;
  kind: "hotel" | "event" | "restaurant";
}

export function BookingsFilter({ properties }: { properties: Property[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const currentStatus   = params.get("status") ?? "";
  const currentProperty = params.get("property") ?? "";

  const update = useCallback(
    (key: string, value: string) => {
      const next = new URLSearchParams(params.toString());
      if (value) next.set(key, value);
      else next.delete(key);
      router.push(`${pathname}?${next.toString()}`);
    },
    [params, pathname, router],
  );

  return (
    <div className="flex flex-wrap gap-3">
      {/* Status filter */}
      <select
        value={currentStatus}
        onChange={(e) => update("status", e.target.value)}
        className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Property filter */}
      {properties.length > 1 && (
        <select
          value={currentProperty}
          onChange={(e) => update("property", e.target.value)}
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-orange-300"
        >
          <option value="">All properties</option>
          {properties.map((p) => (
            <option key={p.id} value={p.id}>
              {p.kind === "hotel" ? "🏨" : p.kind === "event" ? "🎉" : "🍽️"} {p.name}
            </option>
          ))}
        </select>
      )}
    </div>
  );
}

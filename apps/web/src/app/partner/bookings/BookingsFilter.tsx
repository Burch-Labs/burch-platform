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

const CHIP_STYLES: Record<string, { base: string; active: string }> = {
  PENDING:   { base: "border-amber-200 text-amber-700 bg-amber-50 hover:bg-amber-100",   active: "border-amber-400 bg-amber-100 ring-1 ring-amber-400" },
  CONFIRMED: { base: "border-green-200 text-green-700 bg-green-50 hover:bg-green-100",   active: "border-green-400 bg-green-100 ring-1 ring-green-400" },
  CANCELLED: { base: "border-red-200 text-red-700 bg-red-50 hover:bg-red-100",           active: "border-red-400 bg-red-100 ring-1 ring-red-400" },
  COMPLETED: { base: "border-gray-200 text-gray-500 bg-gray-50 hover:bg-gray-100",       active: "border-gray-400 bg-gray-100 ring-1 ring-gray-400" },
};

interface Property {
  id: string;
  name: string;
  kind: "hotel" | "event" | "restaurant";
}

interface BookingsFilterProps {
  properties: Property[];
  statusCounts: Record<string, number>;
  statusOrder: string[];
}

export function BookingsFilter({ properties, statusCounts, statusOrder }: BookingsFilterProps) {
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

  const handleChip = useCallback(
    (status: string) => {
      // Toggle: clicking the active chip clears the filter
      update("status", currentStatus === status ? "" : status);
    },
    [currentStatus, update],
  );

  const hasAnyCounts = statusOrder.some((s) => (statusCounts[s] ?? 0) > 0);

  return (
    <div className="space-y-3">
      {/* Status summary chips */}
      {hasAnyCounts && (
        <div className="flex flex-wrap gap-2">
          {statusOrder.map((status) => {
            const count = statusCounts[status] ?? 0;
            if (count === 0) return null;
            const styles = CHIP_STYLES[status] ?? CHIP_STYLES.PENDING;
            const isActive = currentStatus === status;
            const label = status.charAt(0) + status.slice(1).toLowerCase();
            return (
              <button
                key={status}
                onClick={() => handleChip(status)}
                className={`inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-full border transition-all ${styles.base} ${isActive ? styles.active : ""}`}
              >
                <span>{label}</span>
                <span className="font-semibold">{count}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Dropdown filters */}
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
    </div>
  );
}

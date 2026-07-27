"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

interface SavedSearch {
  id:       string;
  name:     string;
  q:        string;
  category: string;
  city:     string;
  dateFrom: string;
  dateTo:   string;
  createdAt: string;
}

interface SavedSearchesListProps {
  searches: SavedSearch[];
}

function buildHref(s: SavedSearch): string {
  const p = new URLSearchParams();
  if (s.q)        p.set("q", s.q);
  if (s.category) p.set("category", s.category);
  if (s.city)     p.set("city", s.city);
  if (s.dateFrom) p.set("dateFrom", s.dateFrom);
  if (s.dateTo)   p.set("dateTo", s.dateTo);
  const qs = p.toString();
  return `/events${qs ? `?${qs}` : ""}`;
}

function buildDescription(s: SavedSearch): string {
  const parts: string[] = [];
  if (s.q)        parts.push(`"${s.q}"`);
  if (s.category) parts.push(s.category.charAt(0) + s.category.slice(1).toLowerCase().replace("_", " "));
  if (s.city)     parts.push(`in ${s.city}`);
  if (s.dateFrom) parts.push(`from ${s.dateFrom}`);
  if (s.dateTo)   parts.push(`to ${s.dateTo}`);
  return parts.length > 0 ? parts.join(" · ") : "All events";
}

export function SavedSearchesList({ searches: initial }: SavedSearchesListProps) {
  const [searches, setSearches] = useState(initial);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleDelete(id: string) {
    setDeletingId(id);
    startTransition(async () => {
      try {
        await fetch(`/api/saved-searches/${id}`, { method: "DELETE" });
        setSearches((prev) => prev.filter((s) => s.id !== id));
      } finally {
        setDeletingId(null);
      }
    });
  }

  if (searches.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
        <p className="text-2xl mb-1">🔖</p>
        <p className="text-sm text-gray-500">No saved searches yet.</p>
        <Link
          href="/events"
          className="mt-2 inline-block text-xs text-orange-600 hover:underline font-medium"
        >
          Browse events
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {searches.map((s) => (
        <div
          key={s.id}
          className="bg-white rounded-xl border border-gray-100 px-4 py-3 flex items-center gap-3"
        >
          <span className="text-lg shrink-0">🔍</span>
          <div className="flex-1 min-w-0">
            <Link
              href={buildHref(s)}
              className="text-sm font-medium text-gray-900 hover:text-orange-600 transition truncate block"
            >
              {s.name}
            </Link>
            <p className="text-xs text-gray-400 truncate">{buildDescription(s)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Link
              href={buildHref(s)}
              className="text-xs text-orange-600 hover:text-orange-700 font-medium transition"
            >
              View →
            </Link>
            <button
              onClick={() => handleDelete(s.id)}
              disabled={deletingId === s.id}
              className="text-xs text-gray-400 hover:text-red-500 transition disabled:opacity-50"
              aria-label="Delete saved search"
            >
              {deletingId === s.id ? "…" : "✕"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

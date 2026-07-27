"use client";

import { useState, useTransition } from "react";
import { useSearchParams } from "next/navigation";

interface SaveSearchButtonProps {
  /** Whether the current visitor is signed in */
  isLoggedIn: boolean;
}

export function SaveSearchButton({ isLoggedIn }: SaveSearchButtonProps) {
  const params = useSearchParams();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Only show when at least one filter is active
  const q        = params.get("q") ?? "";
  const category = params.get("category") ?? "";
  const city     = params.get("city") ?? "";
  const dateFrom = params.get("dateFrom") ?? "";
  const dateTo   = params.get("dateTo") ?? "";
  const hasFilters = q || category || city || dateFrom || dateTo;

  if (!hasFilters) return null;

  function buildDefaultName() {
    const parts: string[] = [];
    if (q) parts.push(`"${q}"`);
    if (category) parts.push(category.charAt(0) + category.slice(1).toLowerCase().replace("_", " "));
    if (city) parts.push(`in ${city}`);
    return parts.join(" · ") || "My search";
  }

  function openDialog() {
    if (!isLoggedIn) {
      window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.href)}`;
      return;
    }
    setName(buildDefaultName());
    setError(null);
    setSaved(false);
    setOpen(true);
  }

  function handleSave() {
    if (!name.trim()) {
      setError("Please enter a name for this search.");
      return;
    }
    startTransition(async () => {
      try {
        const res = await fetch("/api/saved-searches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), q, category, city, dateFrom, dateTo }),
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          setError((data as { error?: string }).error ?? "Failed to save search.");
          return;
        }
        setSaved(true);
        setTimeout(() => setOpen(false), 1200);
      } catch {
        setError("Something went wrong. Please try again.");
      }
    });
  }

  return (
    <>
      <button
        onClick={openDialog}
        className="inline-flex items-center gap-1.5 text-sm text-orange-600 hover:text-orange-700 font-medium transition"
        aria-label="Save this search"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
        </svg>
        Save search
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
          onClick={(e) => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            {saved ? (
              <div className="text-center py-4">
                <span className="text-3xl">🎉</span>
                <p className="mt-2 text-sm font-medium text-gray-800">Search saved!</p>
                <p className="text-xs text-gray-500 mt-1">
                  Find it in your dashboard under "Saved searches".
                </p>
              </div>
            ) : (
              <>
                <h2 className="text-base font-semibold text-gray-900 mb-1">Save this search</h2>
                <p className="text-xs text-gray-500 mb-4">
                  Give it a name so you can find it again from your dashboard.
                </p>

                <label className="block text-xs font-medium text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => { setName(e.target.value); setError(null); }}
                  onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                  maxLength={100}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
                  autoFocus
                />
                {error && (
                  <p className="mt-1.5 text-xs text-red-600">{error}</p>
                )}

                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setOpen(false)}
                    className="flex-1 border border-gray-200 rounded-lg py-2 text-sm text-gray-600 hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isPending}
                    className="flex-1 bg-orange-600 text-white rounded-lg py-2 text-sm font-medium hover:bg-orange-700 disabled:opacity-60 transition"
                  >
                    {isPending ? "Saving…" : "Save"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

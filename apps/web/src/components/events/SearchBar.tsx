"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState, useTransition, useCallback } from "react";

export function SearchBar() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [value, setValue] = useState(params.get("q") ?? "");

  const push = useCallback(
    (newQ: string) => {
      const next = new URLSearchParams(params.toString());
      if (newQ) {
        next.set("q", newQ);
      } else {
        next.delete("q");
      }
      next.delete("page");
      startTransition(() => router.push(`${pathname}?${next.toString()}`));
    },
    [params, pathname, router]
  );

  return (
    <div className="relative">
      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
        {isPending ? (
          <svg className="animate-spin w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
          </svg>
        ) : (
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        )}
      </div>
      <input
        type="search"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          push(e.target.value);
        }}
        placeholder="Search events, venues, neighbourhoods…"
        className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent bg-white transition"
      />
    </div>
  );
}

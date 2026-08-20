"use client";

import { useState, useTransition } from "react";
import { toggleEventFeatured } from "./actions";

export function FeaturedToggle({ eventId, initial }: { eventId: string; initial: boolean }) {
  const [featured, setFeatured] = useState(initial);
  const [isPending, startTransition] = useTransition();

  return (
    <button
      type="button"
      disabled={isPending}
      onClick={() => {
        const next = !featured;
        setFeatured(next);
        startTransition(async () => {
          try {
            await toggleEventFeatured(eventId, next);
          } catch {
            setFeatured(!next);
          }
        });
      }}
      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 border transition disabled:opacity-50 ${
        featured
          ? "bg-amber-50 text-amber-700 border-amber-200"
          : "bg-gray-50 text-gray-500 border-gray-200 hover:border-gray-300"
      }`}
    >
      {featured ? "★ Top Pick" : "Add to Top Picks"}
    </button>
  );
}

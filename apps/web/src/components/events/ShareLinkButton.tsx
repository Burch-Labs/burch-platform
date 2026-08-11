"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";

const DEFAULT_FILTER_PARAMS = ["q", "category", "city", "dateFrom", "dateTo"];

interface ShareLinkButtonProps {
  /** Names of query params that count as "active filters". Defaults to event filter params. */
  filterParams?: string[];
}

export function ShareLinkButton({ filterParams = DEFAULT_FILTER_PARAMS }: ShareLinkButtonProps) {
  const params = useSearchParams();
  const [copied, setCopied] = useState(false);

  // Only show when at least one filter is active
  const hasFilters = filterParams.some((key) => params.get(key));

  if (!hasFilters) return null;

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that block clipboard access
      const textArea = document.createElement("textarea");
      textArea.value = window.location.href;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={handleCopy}
      className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 font-medium transition"
      aria-label="Copy link to this search"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-600">Copied!</span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-4 10h6a2 2 0 002-2v-8a2 2 0 00-2-2h-6a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
          Copy link
        </>
      )}
    </button>
  );
}

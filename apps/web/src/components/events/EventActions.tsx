"use client";

import { useState } from "react";

interface EventActionsProps {
  title: string;
  description?: string | null;
  location: string;
  city?: string;
  /** ISO strings so this stays a plain client-serializable prop. */
  startDate: string;
  endDate: string;
}

/** Google Calendar wants YYYYMMDDTHHmmssZ, no separators. */
function toGCalStamp(iso: string): string {
  return new Date(iso).toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function googleCalendarUrl(props: EventActionsProps): string {
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: props.title,
    dates: `${toGCalStamp(props.startDate)}/${toGCalStamp(props.endDate)}`,
    location: props.city ? `${props.location}, ${props.city}` : props.location,
  });
  if (props.description) params.set("details", props.description.slice(0, 500));
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

/**
 * Add-to-calendar plus a real per-event share menu — WhatsApp, LinkedIn,
 * copy link. The event listing page already has a "copy the current search"
 * button; this is the one for sharing a specific event, which didn't exist.
 */
export function EventActions(props: EventActionsProps) {
  const [copied, setCopied] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  async function handleCopy() {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      const textArea = document.createElement("textarea");
      textArea.value = url;
      textArea.style.position = "fixed";
      textArea.style.opacity = "0";
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const shareText = `${props.title} — on dontbeboringKE`;
  // window.location.href isn't available at render time on the server, but
  // this component only ever runs on the client ("use client" + useState),
  // so it's safe to read here, inside the handlers/render below.
  const pageUrl = typeof window !== "undefined" ? window.location.href : "";

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
      <a
        href={googleCalendarUrl(props)}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-orange-600 transition"
      >
        <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
        Add to Google Calendar
      </a>

      <div className="relative">
        <button
          type="button"
          onClick={() => setShareOpen((v) => !v)}
          className="flex items-center gap-2.5 text-sm font-medium text-gray-700 hover:text-orange-600 transition"
          aria-expanded={shareOpen}
        >
          <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8.684 13.342a3 3 0 100-2.684m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 8.658a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
          </svg>
          Share event
        </button>

        {shareOpen && (
          <div className="mt-2 flex flex-col gap-1 border-t border-gray-100 pt-2">
            <a
              href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${pageUrl}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-green-600 transition py-0.5"
            >
              Share on WhatsApp
            </a>
            <a
              href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(pageUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 hover:text-blue-600 transition py-0.5"
            >
              Share on LinkedIn
            </a>
            <button
              type="button"
              onClick={handleCopy}
              className="text-sm text-gray-500 hover:text-orange-600 transition py-0.5 text-left"
            >
              {copied ? "Link copied!" : "Copy link"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

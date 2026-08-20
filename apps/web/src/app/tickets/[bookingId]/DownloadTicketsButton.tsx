"use client";

/**
 * There's no PDF generated anywhere — this hands off to the browser's own
 * print dialog, which on every modern OS offers "Save as PDF" as a print
 * destination. The page's print:* CSS classes already lay it out for paper
 * (chrome hidden, tear-line hidden, one ticket per printed block); this
 * button is the only piece that was missing.
 */
export function DownloadTicketsButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="flex items-center gap-1.5 text-xs font-medium text-orange-300 hover:text-orange-200 transition-colors"
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v12m0 0l-4-4m4 4l4-4M5 19h14" />
      </svg>
      Download
    </button>
  );
}

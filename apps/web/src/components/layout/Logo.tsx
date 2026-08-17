import Link from "next/link";

/**
 * The mark: an event-ticket stub, same as any "get tickets" icon — except
 * the perforation isn't a plain dashed line. It's broken by a four-point
 * spark, the same mark already used for the AI Concierge (✦) elsewhere in
 * the nav. The literal read: even the boring dotted line in the middle of a
 * ticket gets a spark. That's the whole brand promise in one small shape.
 *
 * White cutouts assume a light background — true everywhere this is used.
 */
export function LogoMark({ className = "h-6 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="currentColor" />
      <circle cx="16" cy="1" r="3.5" fill="white" />
      <circle cx="16" cy="23" r="3.5" fill="white" />
      <line x1="16" y1="6" x2="16" y2="8.3" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
      <path
        d="M16 9 L16.74 11.26 L19 12 L16.74 12.74 L16 15 L15.26 12.74 L13 12 L15.26 11.26 Z"
        fill="white"
      />
      <line x1="16" y1="15.7" x2="16" y2="18" stroke="white" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

interface LogoProps {
  href?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

/**
 * Icon + wordmark, linked home. "KE" sits in its own chip rather than just
 * running on as more letters — reads as a deliberate suffix (this market,
 * specifically) rather than an afterthought tacked onto the name.
 */
export function Logo({
  href = "/",
  className = "flex items-center gap-2 text-orange-600",
  markClassName = "h-6 w-8",
  wordmarkClassName = "font-display text-xl font-semibold tracking-wide",
}: LogoProps) {
  return (
    <Link href={href} className={className}>
      <LogoMark className={markClassName} />
      <span className={`flex items-center gap-1 ${wordmarkClassName}`}>
        dontbeboring
        <span className="text-[0.55em] font-sans font-bold tracking-wider bg-orange-600 text-white rounded px-1 py-0.5 align-middle">
          KE
        </span>
      </span>
    </Link>
  );
}

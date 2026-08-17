import Link from "next/link";

/**
 * The ticket mark: a classic stub shape (rounded rectangle, notched top and
 * bottom where a perforation line would run) — reads as "event" at a glance,
 * at any size. White cutouts assume a light background, true everywhere it's
 * used (NavBar, AuthCard).
 */
export function LogoMark({ className = "h-6 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 24" fill="none" className={className} aria-hidden="true">
      <rect x="1" y="1" width="30" height="22" rx="5" fill="currentColor" />
      <circle cx="16" cy="1" r="3.5" fill="white" />
      <circle cx="16" cy="23" r="3.5" fill="white" />
      <line x1="16" y1="6.5" x2="16" y2="9.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="12" x2="16" y2="15" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <line x1="16" y1="17.5" x2="16" y2="20.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

interface LogoProps {
  href?: string;
  className?: string;
  markClassName?: string;
  wordmarkClassName?: string;
}

/** Icon + wordmark, linked home. The one place the brand mark is assembled. */
export function Logo({
  href = "/",
  className = "flex items-center gap-2 text-orange-600",
  markClassName = "h-6 w-8",
  wordmarkClassName = "font-display text-xl font-semibold tracking-wide",
}: LogoProps) {
  return (
    <Link href={href} className={className}>
      <LogoMark className={markClassName} />
      <span className={wordmarkClassName}>dontbeboringKE</span>
    </Link>
  );
}

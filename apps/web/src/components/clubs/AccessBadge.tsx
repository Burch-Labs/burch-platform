import type { ClubAccess } from "@prisma/client";
import { cn } from "@/lib/utils";

/**
 * States plainly whether a visitor can play.
 *
 * Worded from the reader's side rather than the club's — "Members only" tells
 * someone they cannot play; "Members' club" leaves them guessing. Getting this
 * wrong sends a person on an hour's drive to Limuru to be turned away at the
 * gate, so the wording errs towards discouraging.
 */
const LABELS: Record<ClubAccess, { label: string; tone: string }> = {
  MEMBERS_ONLY:     { label: "Members only",   tone: "bg-gray-900/85 text-white" },
  BY_ARRANGEMENT:   { label: "Call ahead",     tone: "bg-white/90 text-gray-800" },
  VISITORS_WELCOME: { label: "Visitors welcome", tone: "bg-orange-100/95 text-orange-800" },
};

export function AccessBadge({ access, className }: { access: ClubAccess; className?: string }) {
  const { label, tone } = LABELS[access];
  return (
    <span
      className={cn(
        "inline-block text-xs font-semibold px-2.5 py-1 rounded-full backdrop-blur-sm",
        tone,
        className
      )}
    >
      {label}
    </span>
  );
}

/** Longer form for detail pages, where there is room to say what it means. */
export const ACCESS_EXPLANATION: Record<ClubAccess, string> = {
  MEMBERS_ONLY:
    "This club is open to members and their guests. Visitors cannot book a round directly.",
  BY_ARRANGEMENT:
    "Visitors can play, but need to arrange it with the club in advance rather than turning up.",
  VISITORS_WELCOME:
    "Visiting golfers are welcome. Pay the green fee at the clubhouse — no introduction needed.",
};

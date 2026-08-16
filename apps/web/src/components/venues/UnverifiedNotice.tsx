import Link from "next/link";

interface UnverifiedNoticeProps {
  venueType: "hotel" | "restaurant" | "club";
  venueId: string;
  venueName: string;
  /** True when we hold no phone, email or website at all. */
  bare: boolean;
}

/**
 * Says out loud that a listing's details are ours rather than the venue's.
 *
 * We researched these listings; nobody at the venue has confirmed them. Showing
 * an unconfirmed phone number as though it were verified is how a guest ends up
 * calling a stranger, so the notice is deliberately plain about it.
 *
 * It doubles as the way the gap closes. Every unverified listing is a venue we
 * have not signed up yet, and this is the invitation — which makes the missing
 * data a route to partners rather than a debt to pay off by hand.
 */
export function UnverifiedNotice({ venueType, venueId, venueName, bare }: UnverifiedNoticeProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
      <p className="text-sm font-medium text-gray-700 mb-1">
        {bare ? `We don't have booking details for ${venueName} yet` : "These details are unconfirmed"}
      </p>
      <p className="text-sm text-gray-500 leading-relaxed">
        {bare
          ? "We list this venue because it is worth knowing about, but nobody there has given us a way to book yet."
          : "We put this listing together ourselves. The venue has not confirmed it, so check before you rely on it."}
      </p>
      <Link
        href={`/claim/${venueType}/${venueId}`}
        className="inline-block mt-3 text-sm font-semibold text-orange-700 underline underline-offset-2 hover:no-underline"
      >
        Work here? Claim this listing
      </Link>
    </div>
  );
}

import { cn } from "@/lib/utils";
import { UnverifiedNotice } from "./UnverifiedNotice";

interface BookExternallyProps {
  /** The venue's own booking page. Null until the partner supplies one. */
  website: string | null;
  venueName: string;
  phone?: string | null;
  email?: string | null;
  /** Whether the venue itself confirmed these details. */
  verified?: boolean;
  /** Used to build the claim link when details are unconfirmed. */
  venueType?: "hotel" | "restaurant" | "club";
  venueId?: string;
  className?: string;
}

/**
 * Sends the guest to the venue's own booking page instead of taking the
 * booking ourselves. Shown wherever a Book or Reserve button would sit while
 * `FEATURES.directBooking` is off.
 *
 * Falls back to whatever contact details we hold when a venue has not given us
 * a booking URL, so the card never dead-ends. It deliberately does not imply we
 * hold availability — we do not, and saying otherwise would be a promise we
 * cannot keep.
 */
export function BookExternally({
  website,
  venueName,
  phone,
  email,
  verified = false,
  venueType,
  venueId,
  className,
}: BookExternallyProps) {
  // Unconfirmed details never get a confident "Book" button. Sending someone to
  // a URL we guessed at, under a button that says booking, is the failure this
  // whole flag exists to prevent.
  if (!verified && venueType && venueId) {
    return (
      <div className={cn("space-y-2", className)}>
        {(website || phone || email) && (
          <div className="rounded-xl border border-gray-200 bg-surface px-5 py-4 space-y-1">
            <p className="text-sm font-medium text-gray-700 mb-1">What we have</p>
            {website && (
              <p className="text-sm">
                <a
                  href={website}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="text-orange-700 hover:underline break-all"
                >
                  {website.replace(/^https?:\/\//, "")}
                </a>
              </p>
            )}
            {phone && (
              <p className="text-sm text-gray-600">
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-orange-700 hover:underline">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="text-sm text-gray-600">
                <a href={`mailto:${email}`} className="text-orange-700 hover:underline">
                  {email}
                </a>
              </p>
            )}
          </div>
        )}
        <UnverifiedNotice
          venueType={venueType}
          venueId={venueId}
          venueName={venueName}
          bare={!website && !phone && !email}
        />
      </div>
    );
  }

  if (website) {
    return (
      <div className={cn("space-y-2", className)}>
        <a
          href={website}
          target="_blank"
          // noreferrer alongside noopener: this is an outbound link to a third
          // party, and the destination has no need for our referrer.
          rel="noopener noreferrer nofollow"
          className="flex items-center justify-center gap-2 w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
        >
          Book on {venueName}&apos;s website
          <span aria-hidden>↗</span>
        </a>
        <p className="text-xs text-gray-400 text-center">
          Booking is handled by the venue. You will leave dontbeboringKE.
        </p>
      </div>
    );
  }

  const hasContact = phone || email;

  return (
    <div className={cn("space-y-2", className)}>
      <div className="rounded-xl border border-gray-200 bg-gray-50 px-5 py-4">
        <p className="text-sm font-medium text-gray-700 mb-1">
          Book directly with {venueName}
        </p>
        {hasContact ? (
          <div className="space-y-0.5">
            {phone && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-400">Phone</span>{" "}
                <a href={`tel:${phone.replace(/\s/g, "")}`} className="text-orange-700 hover:underline">
                  {phone}
                </a>
              </p>
            )}
            {email && (
              <p className="text-sm text-gray-600">
                <span className="text-gray-400">Email</span>{" "}
                <a href={`mailto:${email}`} className="text-orange-700 hover:underline">
                  {email}
                </a>
              </p>
            )}
          </div>
        ) : (
          <p className="text-sm text-gray-500">
            We do not have booking details for this venue yet.
          </p>
        )}
      </div>
    </div>
  );
}

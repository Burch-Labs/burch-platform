"use client";

export interface OfferItem {
  id: string;
  title: string;
  description: string | null;
  flyerUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
}

type OfferKind = "hotelHappening" | "hotelSpaOffer" | "clubHappening";

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (startsAt && endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  return fmt((startsAt ?? endsAt) as string);
}

function recordView(kind: OfferKind, id: string) {
  // Fire-and-forget — the flyer already opened; a failed increment isn't
  // worth blocking or retrying for.
  fetch("/api/offers/view", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ kind, id }),
    keepalive: true,
  }).catch(() => {});
}

/** Read-only public display for Happenings/Spa/Club offers — the CRUD
 * counterpart is HappeningsManager. Kept separate since this one needs no
 * server actions and renders on pages with no session context. */
export function OffersList({ offers, kind }: { offers: OfferItem[]; kind: OfferKind }) {
  return (
    <div className="space-y-4">
      {offers.map((offer) => {
        const card = (
          <div className="flex items-start gap-4 bg-surface rounded-xl border border-orange-100 p-4">
            {offer.flyerUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={offer.flyerUrl}
                alt={offer.title}
                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
              />
            )}
            <div className="min-w-0">
              <h3 className="font-semibold text-gray-900">{offer.title}</h3>
              {formatRange(offer.startsAt, offer.endsAt) && (
                <p className="text-xs text-orange-700 font-medium mt-0.5">
                  {formatRange(offer.startsAt, offer.endsAt)}
                </p>
              )}
              {offer.description && (
                <p className="text-sm text-gray-600 leading-relaxed mt-1.5 whitespace-pre-line">
                  {offer.description}
                </p>
              )}
            </div>
          </div>
        );

        if (!offer.flyerUrl) return <div key={offer.id}>{card}</div>;

        return (
          <a
            key={offer.id}
            href={offer.flyerUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => recordView(kind, offer.id)}
            className="block hover:opacity-90 transition"
          >
            {card}
          </a>
        );
      })}
    </div>
  );
}

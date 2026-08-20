import { formatVenueAddress } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { resolveBaseUrl } from "@/lib/config-check";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { AmenityList } from "@/components/hotels/AmenityList";
import { ReviewsList } from "@/components/hotels/ReviewsList";
import { BookExternally } from "@/components/venues/BookExternally";
import { OffersList } from "@/components/venues/OffersList";
import { FEATURES } from "@/lib/features";
import { HotelStars, StarRating } from "@/components/hotels/StarRating";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { name: true, description: true, imageUrl: true, city: true, location: true },
  });
  if (!hotel) return { title: "Hotel not found" };
  const description =
    hotel.description ?? `${hotel.name} in ${hotel.city} — ${hotel.location}. Book on dontbeboringKE.`;
  return {
    title: hotel.name,
    description,
    openGraph: {
      title: hotel.name,
      description,
      type: "website",
      images: hotel.imageUrl ? [{ url: hotel.imageUrl }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: hotel.name,
      description,
      images: hotel.imageUrl ? [hotel.imageUrl] : undefined,
    },
  };
}

export default async function HotelDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [session, hotel] = await Promise.all([
    getServerSession(authOptions),
    prisma.hotel.findUnique({
      where: { id, published: true },
      include: {
        partner: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        happenings: {
          where: { published: true },
          orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        },
        spaOffers: {
          where: { published: true },
          orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
  ]);

  if (!hotel) notFound();

  const happenings = hotel.happenings.map((h) => ({
    ...h,
    startsAt: h.startsAt ? h.startsAt.toISOString() : null,
    endsAt: h.endsAt ? h.endsAt.toISOString() : null,
  }));
  const spaOffers = hotel.spaOffers.map((o) => ({
    ...o,
    startsAt: o.startsAt ? o.startsAt.toISOString() : null,
    endsAt: o.endsAt ? o.endsAt.toISOString() : null,
  }));

  const ratings = hotel.reviews.map((r) => r.rating);
  const avgRating =
    ratings.length > 0
      ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
      : null;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r === star).length,
  }));

  const allImages = [
    ...(hotel.imageUrl ? [hotel.imageUrl] : []),
    ...hotel.images.filter((img) => img !== hotel.imageUrl),
  ];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "LodgingBusiness",
    name: hotel.name,
    description: hotel.description ?? undefined,
    image: allImages.length > 0 ? allImages : undefined,
    starRating: hotel.starRating ? { "@type": "Rating", ratingValue: hotel.starRating } : undefined,
    telephone: hotel.phone ?? undefined,
    email: hotel.email ?? undefined,
    url: `${resolveBaseUrl()}/hotels/${hotel.id}`,
    address: { "@type": "PostalAddress", streetAddress: hotel.location, addressLocality: hotel.city, addressCountry: "KE" },
    ...(avgRating !== null
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating,
            reviewCount: hotel._count.reviews,
          },
        }
      : {}),
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <script
        type="application/ld+json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <NavBar />

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* ── Breadcrumb ─────────────────────────────────── */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/hotels" className="hover:text-orange-600 transition">
            Hotels
          </Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{hotel.name}</span>
        </div>

        {/* ── Gallery / placeholder ──────────────────────── */}
        {allImages.length > 0 ? (
          <div className="mb-8">
            <HotelGallery images={allImages} name={hotel.name} />
          </div>
        ) : hotel.website ? (
          <a
            href={hotel.website}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="group mb-8 h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex flex-col items-center justify-center gap-3 hover:from-gray-800 hover:to-black transition-colors"
          >
            <span className="text-7xl opacity-60">🏨</span>
            <span className="text-sm font-medium text-white/90 group-hover:text-white transition-colors">
              See photos on {hotel.name}&apos;s official website →
            </span>
          </a>
        ) : (
          <div className="mb-8 h-64 sm:h-72 md:h-80 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <span className="text-7xl opacity-60">🏨</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* ── Left: hotel information ──────────────────── */}
          <div className="flex-1 min-w-0 space-y-8">

            {/* Header */}
            <div>
              <div className="flex flex-wrap items-start gap-3 mb-2">
                {FEATURES.starRating && hotel.starRating && <HotelStars stars={hotel.starRating} />}
                {FEATURES.ratings && avgRating !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white bg-orange-500 rounded-md px-2 py-0.5">
                      {avgRating.toFixed(1)}
                    </span>
                    <StarRating rating={avgRating} size="sm" count={hotel._count.reviews} />
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{hotel.name}</h1>
              <p className="text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formatVenueAddress(hotel.location, hotel.city)}
              </p>
            </div>

            {/* Quick-info strip */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Check-in",  value: hotel.checkInTime },
                { label: "Check-out", value: hotel.checkOutTime },
                { label: "Contact", value: hotel.phone ?? hotel.email ?? "At reception" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Happenings */}
            <div
              id="happenings"
              className="scroll-mt-24 bg-gradient-to-br from-orange-50/70 to-white rounded-2xl border border-orange-100 p-6"
            >
              <div className="flex items-center gap-2 mb-4">
                <span aria-hidden>✨</span>
                <h2 className="text-lg font-semibold text-gray-900">Happenings</h2>
                {happenings.length === 0 && (
                  <span className="text-xs font-medium text-orange-700 bg-orange-100 rounded-full px-2.5 py-0.5">
                    Coming soon
                  </span>
                )}
              </div>

              {happenings.length > 0 ? (
                <OffersList offers={happenings} kind="hotelHappening" />
              ) : (
                <p className="text-sm text-gray-600 leading-relaxed max-w-prose">
                  Restaurant events and activities at {hotel.name} — Sunday brunch, live band
                  nights, seasonal specials, and more — will show up here as we add them.
                </p>
              )}

              {hotel.website && (
                <p className="text-sm text-gray-500 mt-4">
                  Booking a stay?{" "}
                  <a
                    href={hotel.website}
                    target="_blank"
                    rel="noopener noreferrer nofollow"
                    className="text-orange-700 font-medium hover:underline"
                  >
                    Visit {hotel.name}&apos;s official site ↗
                  </a>
                </p>
              )}
            </div>

            {/* Spa & Wellness — separate section below Happenings, only
                shown when the hotel has actually added something, so a
                hotel with no spa doesn't get an empty tab. */}
            {spaOffers.length > 0 && (
              <div
                id="spa"
                className="scroll-mt-24 bg-gradient-to-br from-orange-50/70 to-white rounded-2xl border border-orange-100 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span aria-hidden>💆</span>
                  <h2 className="text-lg font-semibold text-gray-900">Spa &amp; Wellness</h2>
                </div>
                <OffersList offers={spaOffers} kind="hotelSpaOffer" />
              </div>
            )}

            {/* Description */}
            {hotel.description && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {hotel.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities.length > 0 && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
                <AmenityList amenities={hotel.amenities} />
              </div>
            )}

            {/* Guest reviews */}
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Guest reviews
                {hotel._count.reviews > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">
                    ({hotel._count.reviews})
                  </span>
                )}
              </h2>
              {FEATURES.ratings && (
                <ReviewsList
                  hotelId={hotel.id}
                  initialReviews={hotel.reviews}
                  avgRating={avgRating}
                  distribution={distribution}
                  isAuthenticated={!!session}
                />
              )}
            </div>
          </div>

          {/* ── Right: accommodation — a link out, nothing else ───── */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-20">
              <BookExternally
                website={hotel.website}
                venueName={hotel.name}
                phone={hotel.phone}
                email={hotel.email}
                verified={hotel.verified}
                venueType="hotel"
                venueId={hotel.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

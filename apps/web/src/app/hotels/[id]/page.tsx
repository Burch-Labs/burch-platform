import { formatVenueAddress } from "@/lib/utils";
import { Suspense } from "react";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { AmenityList } from "@/components/hotels/AmenityList";
import { ReviewsList } from "@/components/hotels/ReviewsList";
import { BookingForm } from "@/components/hotels/BookingForm";
import { BookExternally } from "@/components/venues/BookExternally";
import { FEATURES } from "@/lib/features";
import { RoomCard } from "@/components/hotels/RoomCard";
import { HotelStars, StarRating } from "@/components/hotels/StarRating";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: { name: true, description: true },
  });
  if (!hotel) return { title: "Hotel not found" };
  return {
    title: `${hotel.name} — dontbeboringKE`,
    description: hotel.description ?? undefined,
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
        rooms: {
          where: { available: true },
          orderBy: { price: "asc" },
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    }),
  ]);

  if (!hotel) notFound();

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

  // Serialize Prisma Decimal → number so rooms can cross the RSC→client boundary
  // (React 19 / Next.js 15 rejects non-plain objects at the serialization boundary)
  const rooms = hotel.rooms.map((r) => ({
    ...r,
    price: Number(r.price) as unknown as (typeof r)["price"],
  }));

  const minPrice =
    rooms.length > 0
      ? Math.min(...rooms.map((r) => Number(r.price)))
      : null;

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Check-in",  value: hotel.checkInTime },
                { label: "Check-out", value: hotel.checkOutTime },
                {
                  label: "Room types",
                  value: `${rooms.length} type${rooms.length !== 1 ? "s" : ""}`,
                },
                { label: "Contact", value: hotel.phone ?? hotel.email ?? "At reception" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-white rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {hotel.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {hotel.description}
                </p>
              </div>
            )}

            {/* Amenities */}
            {hotel.amenities.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Amenities</h2>
                <AmenityList amenities={hotel.amenities} />
              </div>
            )}

            {/* ── Room Types ─────────────────────────────── */}
            {rooms.length > 0 && (
              <div>
                <div className="flex items-baseline justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    Room types
                    <span className="ml-2 text-sm font-normal text-gray-400">
                      ({rooms.length})
                    </span>
                  </h2>
                  {minPrice !== null && (
                    <p className="text-sm text-gray-500">
                      from{" "}
                      <span className="font-semibold text-gray-900">
                        KES {minPrice.toLocaleString()}
                      </span>
                      <span className="text-gray-400"> / night</span>
                    </p>
                  )}
                </div>

                <div className="space-y-4">
                  {rooms.map((room) => (
                    <RoomCard
                      key={room.id}
                      room={room}
                      hotelId={hotel.id}
                      showBookButton={FEATURES.directBooking && !!session}
                    />
                  ))}
                </div>

                {!session && (
                  <p className="text-sm text-center text-gray-400 mt-4">
                    <Link
                      href={`/auth/login?callbackUrl=/hotels/${hotel.id}`}
                      className="text-orange-600 font-medium hover:underline"
                    >
                      Sign in
                    </Link>{" "}
                    to check availability and reserve a room.
                  </p>
                )}
              </div>
            )}

            {/* Empty rooms state */}
            {rooms.length === 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-2xl mb-2">🛏️</p>
                <p className="text-sm text-gray-500">No rooms listed yet. Contact the hotel directly.</p>
                {hotel.phone && (
                  <p className="text-sm font-medium text-orange-600 mt-2">{hotel.phone}</p>
                )}
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

          {/* ── Right: date picker + live availability ───── */}
          <div className="lg:w-96 flex-shrink-0">
            <div className="sticky top-20">
              {FEATURES.directBooking ? (
                <Suspense
                  fallback={
                    <div className="h-64 bg-white rounded-2xl border border-gray-100 animate-pulse" />
                  }
                >
                  <BookingForm
                    hotelId={hotel.id}
                    rooms={rooms}
                    isAuthenticated={!!session}
                  />
                </Suspense>
              ) : (
                <BookExternally
                  website={hotel.website}
                  venueName={hotel.name}
                  phone={hotel.phone}
                  email={hotel.email}
                  verified={hotel.verified}
                  venueType="hotel"
                  venueId={hotel.id}
                />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

import { formatVenueAddress } from "@/lib/utils";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { AmenityList } from "@/components/hotels/AmenityList";
import { StarRating } from "@/components/hotels/StarRating";
import { ReviewsList } from "@/components/hotels/ReviewsList";
import { MenuSection } from "@/components/restaurants/MenuSection";
import { ReservationForm } from "@/components/restaurants/ReservationForm";
import { BookExternally } from "@/components/venues/BookExternally";
import { FEATURES } from "@/lib/features";
import { OpeningHours } from "@/components/restaurants/OpeningHours";
import { PriceRangeBadge } from "@/components/restaurants/PriceRangeBadge";
import type { OpeningHours as OpeningHoursType } from "@/types/restaurants";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const r = await prisma.restaurant.findUnique({ where: { id }, select: { name: true, description: true } });
  if (!r) return { title: "Restaurant not found" };
  return { title: `${r.name} — dontbeboringKE`, description: r.description ?? undefined };
}

export default async function RestaurantDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [session, restaurant] = await Promise.all([
    getServerSession(authOptions),
    prisma.restaurant.findUnique({
      where: { id, published: true },
      include: {
        partner: { include: { user: { select: { id: true, name: true, image: true } } } },
        menuItems: { where: { available: true }, orderBy: [{ category: "asc" }, { sortOrder: "asc" }] },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { reviews: true, reservations: true } },
      },
    }),
  ]);

  if (!restaurant) notFound();

  const ratings = restaurant.reviews.map((r) => r.rating);
  const avgRating = ratings.length > 0
    ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
    : null;
  const distribution = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: ratings.filter((r) => r === star).length,
  }));

  const allImages = [
    ...(restaurant.imageUrl ? [restaurant.imageUrl] : []),
    ...restaurant.images.filter((img) => img !== restaurant.imageUrl),
  ];

  const openingHours = restaurant.openingHours as OpeningHoursType | null;

  // Build ReviewsList-compatible reviews (treating restaurant reviews as hotel reviews shape)
  const reviewsForList = restaurant.reviews.map((r) => ({
    ...r,
    hotelId: r.restaurantId,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/restaurants" className="hover:text-orange-600 transition">Restaurants</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{restaurant.name}</span>
        </div>

        {/* Gallery / placeholder */}
        {allImages.length > 0 ? (
          <div className="mb-8">
            <HotelGallery images={allImages} name={restaurant.name} />
          </div>
        ) : (
          <div className="mb-8 h-72 rounded-2xl overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <span className="text-8xl opacity-30">🍽️</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: info */}
          <div className="flex-1 min-w-0 space-y-8">
            {/* Header */}
            <div>
              <div className="flex flex-wrap items-center gap-3 mb-2">
                {restaurant.cuisine && (
                  <span className="text-sm font-medium text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                    {restaurant.cuisine}
                  </span>
                )}
                {restaurant.priceRange && <PriceRangeBadge priceRange={restaurant.priceRange} />}
                {FEATURES.ratings && avgRating !== null && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-bold text-white bg-orange-500 rounded-md px-2 py-0.5">
                      {avgRating.toFixed(1)}
                    </span>
                    <StarRating rating={avgRating} size="sm" count={restaurant._count.reviews} />
                  </div>
                )}
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{restaurant.name}</h1>
              <p className="text-gray-500 flex items-center gap-1.5">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {formatVenueAddress(restaurant.location, restaurant.city)}
              </p>
            </div>

            {/* Quick info */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: "Phone", value: restaurant.phone ?? "—" },
                { label: "Email", value: restaurant.email ?? "—" },
                { label: "Cuisine", value: restaurant.cuisine ?? "Various" },
                ...(FEATURES.menus
                  ? [{ label: "Menu items", value: `${restaurant.menuItems.length}` }]
                  : []),
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                </div>
              ))}
            </div>

            {/* Description */}
            {restaurant.description && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{restaurant.description}</p>
              </div>
            )}

            {/* Amenities */}
            {restaurant.amenities.length > 0 && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Features</h2>
                <AmenityList amenities={restaurant.amenities} />
              </div>
            )}

            {/* Menu */}
            {FEATURES.menus && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Menu
                  {restaurant.menuItems.length > 0 && (
                    <span className="ml-2 text-sm font-normal text-gray-400">({restaurant.menuItems.length} items)</span>
                  )}
                </h2>
                <MenuSection items={restaurant.menuItems} />
              </div>
            )}

            {/* Location placeholder */}
            <div className="bg-surface rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-3">Location</h2>
              <p className="text-sm text-gray-600 mb-4">{formatVenueAddress(restaurant.location, restaurant.city)}</p>
              <div className="h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center">
                <div className="text-center">
                  <div className="text-4xl mb-2">📍</div>
                  <p className="text-sm text-gray-500">{restaurant.location}</p>
                  {restaurant.city && <p className="text-xs text-gray-400">{restaurant.city}</p>}
                </div>
              </div>
            </div>

            {/* Reviews */}
            {FEATURES.ratings && (
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Guest reviews
                {restaurant._count.reviews > 0 && (
                  <span className="ml-2 text-sm font-normal text-gray-400">({restaurant._count.reviews})</span>
                )}
              </h2>
              {/* We use a custom reviews component for restaurants */}
              <RestaurantReviewsSection
                restaurantId={restaurant.id}
                reviews={restaurant.reviews}
                avgRating={avgRating}
                distribution={distribution}
                isAuthenticated={!!session}
              />
            </div>
            )}
          </div>

          {/* Right: booking + hours */}
          <div className="lg:w-80 flex-shrink-0 space-y-5">
            <div className="sticky top-20 space-y-5">
              {FEATURES.directBooking ? (
                <ReservationForm
                  restaurantId={restaurant.id}
                  restaurantName={restaurant.name}
                  isAuthenticated={!!session}
                />
              ) : (
                <BookExternally
                  website={restaurant.website}
                  venueName={restaurant.name}
                  phone={restaurant.phone}
                  email={restaurant.email}
                  verified={restaurant.verified}
                  venueType="restaurant"
                  venueId={restaurant.id}
                />
              )}
              {openingHours && <OpeningHours hours={openingHours} />}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

// Inline restaurant reviews section (adapts the hotel ReviewsList pattern)
import { RestaurantReviewsClient } from "@/components/restaurants/RestaurantReviewsClient";
import type { RestaurantReviewWithUser } from "@/types/restaurants";

function RestaurantReviewsSection({
  restaurantId,
  reviews,
  avgRating,
  distribution,
  isAuthenticated,
}: {
  restaurantId: string;
  reviews: RestaurantReviewWithUser[];
  avgRating: number | null;
  distribution: { star: number; count: number }[];
  isAuthenticated: boolean;
}) {
  return (
    <RestaurantReviewsClient
      restaurantId={restaurantId}
      initialReviews={reviews}
      avgRating={avgRating}
      distribution={distribution}
      isAuthenticated={isAuthenticated}
    />
  );
}

import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  { emoji: "🎵", label: "Music", q: "category=MUSIC" },
  { emoji: "💻", label: "Tech", q: "category=TECH" },
  { emoji: "🍽️", label: "Food & Drink", q: "category=FOOD_DRINK" },
  { emoji: "🎨", label: "Arts", q: "category=ARTS" },
  { emoji: "⚽", label: "Sports", q: "category=SPORTS" },
  { emoji: "😂", label: "Comedy", q: "category=COMEDY" },
  { emoji: "🎬", label: "Film", q: "category=FILM" },
  { emoji: "💼", label: "Business", q: "category=BUSINESS" },
];

const CITIES = ["Nairobi", "Lagos", "Accra", "Johannesburg", "Kigali", "Cairo"];

export default async function HomePage() {
  // Fetch a few featured restaurants server-side
  const rawRestaurants = await prisma.restaurant.findMany({
    where: { published: true },
    include: {
      partner: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
      _count: { select: { reviews: true, menuItems: true } },
    },
    orderBy: { name: "asc" },
    take: 3,
  });

  const featuredRestaurants = rawRestaurants.map((r) => {
    const ratings = r.reviews.map((rv) => rv.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    const { reviews: _, ...rest } = r;
    return { ...rest, avgRating };
  });

  return (
    <div className="min-h-screen bg-white">
      <NavBar />

      {/* Hero */}
      <section className="bg-gradient-to-br from-orange-50 via-white to-amber-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-20 text-center">
          <p className="text-sm font-semibold text-orange-600 mb-4 uppercase tracking-widest">
            Africa's Experience Platform
          </p>
          <h1 className="text-5xl sm:text-6xl font-extrabold text-gray-900 mb-5 leading-tight tracking-tight">
            Find your next<br />
            <span className="text-orange-600">unforgettable</span> experience
          </h1>
          <p className="text-lg text-gray-500 mb-10 max-w-xl mx-auto leading-relaxed">
            Concerts, festivals, hotels, restaurants, and AI-powered trip planning — discover and
            book the best of Africa in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className="bg-orange-600 text-white px-8 py-3.5 rounded-xl text-base font-semibold hover:bg-orange-700 transition shadow-sm"
            >
              Browse events
            </Link>
            <Link
              href="/auth/register"
              className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl text-base font-medium hover:bg-gray-50 transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* Category pills */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <h2 className="text-xl font-bold text-gray-900 mb-5">Browse events by category</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ emoji, label, q }) => (
            <Link
              key={label}
              href={`/events?${q}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition group"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 transition">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Cities */}
      <section className="bg-gray-50 border-t border-gray-100 py-12">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-xl font-bold text-gray-900 mb-5">Popular cities</h2>
          <div className="flex flex-wrap gap-3">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/events?city=${city}`}
                className="px-5 py-2.5 bg-white rounded-full border border-gray-200 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-700 transition shadow-sm"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* AI Concierge CTA */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="relative overflow-hidden bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-10">
          {/* decorative glow */}
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-orange-500 opacity-10 blur-3xl pointer-events-none" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-2xl shadow-lg">
              ✦
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold text-orange-400 uppercase tracking-widest mb-1">
                AI Concierge
              </p>
              <h2 className="text-2xl font-bold text-white mb-1">
                Not sure where to start?
              </h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Tell our AI Concierge what you're looking for — hotels, restaurants, events, or a
                full itinerary — and get personalised recommendations instantly.
              </p>
            </div>
            <Link
              href="/concierge"
              className="flex-shrink-0 bg-orange-600 text-white px-7 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm whitespace-nowrap"
            >
              Ask the Concierge →
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Restaurants */}
      {featuredRestaurants.length > 0 && (
        <section className="bg-gray-50 border-t border-gray-100 py-12">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900">Featured restaurants</h2>
                <p className="text-sm text-gray-500 mt-0.5">
                  Top dining experiences across Africa
                </p>
              </div>
              <Link
                href="/restaurants"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
              >
                Browse restaurants
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {featuredRestaurants.map((restaurant) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant as any} />
              ))}
            </div>
            <div className="mt-8 text-center">
              <Link
                href="/restaurants"
                className="inline-block border border-gray-200 text-gray-700 px-7 py-3 rounded-xl text-sm font-medium hover:bg-gray-100 transition"
              >
                View all restaurants
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* CTA banner */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-3xl p-10 text-center">
          <h2 className="text-2xl font-bold text-white mb-2">
            Host your own event?
          </h2>
          <p className="text-orange-100 mb-6 text-sm">
            Join hundreds of organizers using Burch to sell tickets and grow their audience.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-orange-600 font-semibold px-7 py-3 rounded-xl text-sm hover:bg-orange-50 transition"
          >
            Apply as a partner
          </Link>
        </div>
      </section>

      <footer className="border-t border-gray-100 py-8 text-center text-xs text-gray-400">
        © {new Date().getFullYear()} Burch Platform. Africa's AI-Powered Experience Platform.
      </footer>
    </div>
  );
}

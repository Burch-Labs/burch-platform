import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { prisma } from "@/lib/prisma";

const CATEGORIES = [
  { emoji: "🎵", label: "Music",       q: "category=MUSIC" },
  { emoji: "💻", label: "Tech",        q: "category=TECH" },
  { emoji: "🍽️", label: "Food & Drink", q: "category=FOOD_DRINK" },
  { emoji: "🎨", label: "Arts",        q: "category=ARTS" },
  { emoji: "⚽", label: "Sports",      q: "category=SPORTS" },
  { emoji: "😂", label: "Comedy",      q: "category=COMEDY" },
  { emoji: "🎬", label: "Film",        q: "category=FILM" },
  { emoji: "💼", label: "Business",    q: "category=BUSINESS" },
];

const CITIES = ["Nairobi", "Lagos", "Accra", "Johannesburg", "Kigali", "Cairo"];

export default async function HomePage() {
  const rawRestaurants = await prisma.restaurant.findMany({
    where: { published: true },
    include: {
      partner: { select: { id: true, name: true } },
      reviews: { select: { rating: true } },
      _count:  { select: { reviews: true, menuItems: true } },
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
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* ── Hero ───────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-white border-b border-gray-200">
        {/* Warm ambient glow */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-orange-100 opacity-40 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-orange-50 opacity-60 blur-2xl" />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-[0.18em] mb-6 border border-orange-200 bg-orange-50 px-4 py-1.5 rounded-full">
            <span>✦</span> Africa&apos;s Experience Platform
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.08] tracking-tight">
            Find your next<br />
            <span className="text-orange-600 italic">unforgettable</span>{" "}
            experience
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-10 max-w-lg mx-auto leading-relaxed">
            Concerts, festivals, hotels, restaurants, and AI-powered trip
            planning — discover and book the best of Africa in one place.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className="bg-orange-600 text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
            >
              Browse events
            </Link>
            <Link
              href="/auth/register"
              className="border border-gray-200 text-gray-700 bg-white px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Event categories ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-end justify-between mb-6">
          <div>
            <h2 className="font-display text-2xl font-semibold text-gray-900">Browse by category</h2>
            <p className="text-sm text-gray-400 mt-1">Find events that match your taste</p>
          </div>
          <Link href="/events" className="text-sm font-medium text-orange-600 hover:text-orange-700 transition">
            All events →
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {CATEGORIES.map(({ emoji, label, q }) => (
            <Link
              key={label}
              href={`/events?${q}`}
              className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-white hover:border-orange-300 hover:bg-orange-50 transition group shadow-[0_1px_3px_0_rgba(30,21,16,0.05)]"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 transition">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Popular cities ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-12 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">Popular cities</h2>
          <div className="flex flex-wrap gap-3">
            {CITIES.map((city) => (
              <Link
                key={city}
                href={`/events?city=${city}`}
                className="px-5 py-2.5 bg-gray-50 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition"
              >
                {city}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── AI Concierge CTA ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div
          className="relative overflow-hidden rounded-3xl p-10"
          style={{ background: "linear-gradient(135deg, #1A0E07 0%, #2E1A0C 60%, #3D2410 100%)" }}
        >
          {/* Warm glow accent */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #E08A34, transparent)" }} />
          <div className="pointer-events-none absolute -bottom-12 left-12 w-48 h-48 rounded-full opacity-10 blur-2xl"
            style={{ background: "radial-gradient(circle, #ECA85C, transparent)" }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-white text-2xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #E08A34, #B85A12)" }}>
              ✦
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#ECA85C" }}>
                AI Concierge
              </p>
              <h2 className="font-display text-2xl font-semibold text-white mb-1.5">
                Not sure where to start?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#B09880" }}>
                Tell our AI Concierge what you&apos;re looking for — hotels, restaurants, events,
                or a full itinerary — and get personalised recommendations instantly.
              </p>
            </div>
            <Link
              href="/concierge"
              className="flex-shrink-0 text-white px-7 py-3 rounded-xl text-sm font-semibold transition shadow-sm whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #CC6F1A, #B85A12)" }}
            >
              Ask the Concierge →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Restaurants ───────────────────────────────────────────── */}
      {featuredRestaurants.length > 0 && (
        <section className="border-t border-gray-200 py-14 bg-white">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <h2 className="font-display text-2xl font-semibold text-gray-900">
                  Featured restaurants
                </h2>
                <p className="text-sm text-gray-400 mt-1">Top dining experiences across Africa</p>
              </div>
              <Link
                href="/restaurants"
                className="text-sm font-medium text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
              >
                Browse all
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
          </div>
        </section>
      )}

      {/* ── Partner CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="rounded-3xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #CC6F1A 0%, #B85A12 100%)" }}>
          <p className="text-orange-200 text-xs font-semibold uppercase tracking-[0.18em] mb-3">For businesses</p>
          <h2 className="font-display text-3xl font-semibold text-white mb-3">
            Host your own event?
          </h2>
          <p className="text-orange-100 mb-8 text-sm max-w-sm mx-auto leading-relaxed">
            Join hundreds of organizers using Burch to sell tickets and grow their audience across Africa.
          </p>
          <Link
            href="/auth/register"
            className="inline-block bg-white text-orange-700 font-semibold px-8 py-3 rounded-xl text-sm hover:bg-orange-50 transition shadow-sm"
          >
            Apply as a partner
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 py-8 text-center">
        <p className="font-display text-sm text-gray-400 tracking-wide">
          © {new Date().getFullYear()} Burch Platform &nbsp;·&nbsp; Africa&apos;s AI-Powered Experience Platform
        </p>
      </footer>
    </div>
  );
}

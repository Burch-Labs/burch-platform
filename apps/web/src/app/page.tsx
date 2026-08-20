import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { LogoMark } from "@/components/layout/Logo";
import { SparkField } from "@/components/home/SparkField";
import { RestaurantCard } from "@/components/restaurants/RestaurantCard";
import { HotelCard } from "@/components/hotels/HotelCard";
import { EventCard } from "@/components/events/EventCard";
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

const CITIES = [
  "Nairobi", "Mombasa", "Diani", "Malindi",
  "Naivasha", "Nanyuki", "Nakuru", "Kisumu",
];

// Revalidate every 5 minutes — public content changes infrequently
export const revalidate = 300;

export default async function HomePage() {
  const [rawHotels, upcomingEvents, rawRestaurants, topPicks] = await Promise.all([
    prisma.hotel.findMany({
      where: { published: true },
      include: {
        partner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        rooms: { select: { price: true, currency: true } },
        _count: {
          select: {
            rooms: true,
            reviews: true,
            happenings: { where: { published: true } },
          },
        },
      },
      orderBy: { name: "asc" },
      take: 3,
    }),
    prisma.event.findMany({
      where: {
        published: true,
        startDate: { gte: new Date() },
      },
      include: {
        partner: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { startDate: "asc" },
      take: 3,
    }),
    prisma.restaurant.findMany({
      where: { published: true },
      include: {
        partner: { select: { id: true, name: true } },
        reviews: { select: { rating: true } },
        _count:  { select: { reviews: true, menuItems: true } },
      },
      orderBy: { name: "asc" },
      take: 3,
    }),
    prisma.event.findMany({
      where: {
        published: true,
        isFeatured: true,
        startDate: { gte: new Date() },
      },
      include: {
        partner: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { startDate: "asc" },
      take: 6,
    }),
  ]);

  const featuredHotels = rawHotels.map((h) => {
    const ratings = h.reviews.map((rv) => rv.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;
    const { reviews: _, ...rest } = h;
    return { ...rest, avgRating };
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
      <section className="relative overflow-hidden bg-surface border-b border-gray-200">
        {/* Ambient glow — kept low so it tints rather than washing the
            section cream, with a cool counterweight to hold the navy cast */}
        <div className="pointer-events-none absolute -top-32 -right-32 w-[520px] h-[520px] rounded-full bg-orange-100 opacity-25 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 w-80 h-80 rounded-full bg-gray-100 opacity-80 blur-2xl" />

        {/* Drifting sparks — the same mark as the logo and the ticket
            tear-line, in motion. No video asset, disappears entirely under
            prefers-reduced-motion. */}
        <SparkField />

        <div className="relative max-w-5xl mx-auto px-6 py-24 text-center">
          <p className="inline-flex items-center gap-2 text-xs font-semibold text-orange-600 uppercase tracking-[0.18em] mb-6 border border-orange-200 bg-orange-50 px-4 py-1.5 rounded-full">
            <span>✦</span> Kenya&apos;s Experience Platform
          </p>
          <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl font-bold text-gray-900 mb-6 leading-[1.08] tracking-tight">
            Find your next<br />
            <span className="text-orange-600 italic">unforgettable</span>{" "}
            experience
          </h1>
          <p className="text-base sm:text-lg text-gray-500 mb-8 max-w-lg mx-auto leading-relaxed">
            Concerts, festivals, hotels, restaurants, and AI-powered trip
            planning — discover and book the best of Kenya in one place.
          </p>

          {/* Search — the primary way in, ahead of the browse links below it */}
          <form action="/events" method="GET" className="max-w-xl mx-auto mb-8">
            <div className="flex items-center gap-2 bg-surface border border-gray-200 rounded-2xl p-2 shadow-[0_4px_16px_-4px_rgba(30,21,16,0.1)] focus-within:border-orange-300 transition">
              <svg className="w-5 h-5 text-gray-400 ml-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 10.5a6.5 6.5 0 11-13 0 6.5 6.5 0 0113 0z" />
              </svg>
              <input
                type="text"
                name="q"
                placeholder="Search events, venues, or cities"
                className="flex-1 min-w-0 text-sm text-gray-900 placeholder:text-gray-400 bg-transparent outline-none py-2"
              />
              <button
                type="submit"
                className="bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm flex-shrink-0"
              >
                Search
              </button>
            </div>
          </form>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/events"
              className="bg-orange-600 text-white px-8 py-3.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
            >
              Browse events
            </Link>
            <Link
              href="/auth/join"
              className="border border-gray-200 text-gray-700 bg-surface px-8 py-3.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
            >
              Create account
            </Link>
          </div>
        </div>
      </section>

      {/* ── Top Picks ─────────────────────────────────────────────────────── */}
      {topPicks.length > 0 && (
        <section className="max-w-5xl mx-auto px-6 py-14">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                <span aria-hidden>★</span> Top Picks
              </h2>
              <p className="text-sm text-gray-400 mt-1">Hand-picked by the dontbeboringKE team</p>
            </div>
            <Link
              href="/events"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
            >
              Browse all events
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {topPicks.map((event, i) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <EventCard key={event.id} event={event as any} priority={i === 0} />
            ))}
          </div>
        </section>
      )}

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
              className="flex items-center gap-3 p-4 rounded-2xl border border-gray-200 bg-surface hover:border-orange-300 hover:bg-orange-50 transition group shadow-[0_1px_3px_0_rgba(30,21,16,0.05)]"
            >
              <span className="text-2xl">{emoji}</span>
              <span className="text-sm font-medium text-gray-700 group-hover:text-orange-700 transition">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* ── Popular destinations ─────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-12 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="font-display text-2xl font-semibold text-gray-900 mb-6">Popular destinations</h2>
          <div className="flex flex-wrap gap-3">
            {CITIES.map((area) => (
              <Link
                key={area}
                href={`/events?city=${encodeURIComponent(area)}`}
                className="px-5 py-2.5 bg-gray-50 rounded-full border border-gray-200 text-sm font-medium text-gray-600 hover:border-orange-300 hover:text-orange-700 hover:bg-orange-50 transition"
              >
                {area}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Upcoming Events ────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="font-display text-2xl font-semibold text-gray-900">Upcoming events</h2>
            <p className="text-sm text-gray-400 mt-1">Don&apos;t miss what&apos;s on now across Kenya</p>
          </div>
          <Link
            href="/events"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
          >
            Browse all events
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
        {upcomingEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {upcomingEvents.map((event, i) => (
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              <EventCard key={event.id} event={event as any} priority={i === 0} />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-surface px-8 py-12 text-center shadow-[0_1px_3px_0_rgba(30,21,16,0.05)]">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
              🗓️
            </div>
            <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
              No events scheduled right now
            </h3>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Check back soon — new events are added regularly across Kenya.
            </p>
            <Link
              href="/events"
              className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
            >
              Browse all events
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        )}
      </section>

      {/* ── AI Concierge CTA ───────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        <div
          className="relative overflow-hidden rounded-3xl p-10"
          style={{ background: "linear-gradient(135deg, #0B1422 0%, #131E30 60%, #1F2D42 100%)" }}
        >
          {/* Gold glow accent */}
          <div className="pointer-events-none absolute -top-20 -right-20 w-72 h-72 rounded-full opacity-20 blur-3xl"
            style={{ background: "radial-gradient(circle, #C9A73F, transparent)" }} />
          <div className="pointer-events-none absolute -bottom-12 left-12 w-48 h-48 rounded-full opacity-10 blur-2xl"
            style={{ background: "radial-gradient(circle, #DCC168, transparent)" }} />

          <div className="relative flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Navy glyph on bright gold — white on gold does not clear contrast */}
            <div className="flex-shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-lg"
              style={{ background: "linear-gradient(135deg, #DCC168, #C9A73F)", color: "#131E30" }}>
              ✦
            </div>
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-1.5" style={{ color: "#DCC168" }}>
                AI Concierge
              </p>
              <h2 className="font-display text-2xl font-semibold text-white mb-1.5">
                Not sure where to start?
              </h2>
              <p className="text-sm leading-relaxed" style={{ color: "#A6B5CC" }}>
                Tell our AI Concierge what you&apos;re looking for — hotels, restaurants, events,
                or a full itinerary — and get personalised recommendations instantly.
              </p>
            </div>
            <Link
              href="/concierge"
              className="flex-shrink-0 text-white px-7 py-3 rounded-xl text-sm font-semibold transition shadow-sm whitespace-nowrap"
              style={{ background: "linear-gradient(135deg, #EA580C, #9A3412)" }}
            >
              Ask the Concierge →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Featured Restaurants ───────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-14 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                Featured restaurants
              </h2>
              <p className="text-sm text-gray-400 mt-1">Top dining experiences across Kenya</p>
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
          {featuredRestaurants.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
              {featuredRestaurants.map((restaurant, i) => (
                <RestaurantCard key={restaurant.id} restaurant={restaurant as any} priority={i === 0} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-surface px-8 py-12 text-center shadow-[0_1px_3px_0_rgba(30,21,16,0.05)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                🍽️
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                No restaurants listed yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Check back soon — great dining spots will be added here as partners join.
              </p>
              <Link
                href="/restaurants"
                className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
              >
                Browse all restaurants
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Featured Hotels ────────────────────────────────────────────────── */}
      <section className="border-t border-gray-200 py-14 bg-surface">
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex items-end justify-between mb-8">
            <div>
              <h2 className="font-display text-2xl font-semibold text-gray-900">
                Featured hotels
              </h2>
              <p className="text-sm text-gray-400 mt-1">Standout stays across Kenya</p>
            </div>
            <Link
              href="/hotels"
              className="text-sm font-medium text-orange-600 hover:text-orange-700 transition flex items-center gap-1"
            >
              Browse hotels
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
          {featuredHotels.length > 0 ? (
            <div className="flex flex-col divide-y divide-gray-100 border-t border-b border-gray-100">
              {featuredHotels.map((hotel) => (
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                <HotelCard key={hotel.id} hotel={hotel as any} />
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border border-gray-200 bg-surface px-8 py-12 text-center shadow-[0_1px_3px_0_rgba(30,21,16,0.05)]">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-orange-50 text-2xl">
                🏨
              </div>
              <h3 className="font-display text-lg font-semibold text-gray-900 mb-2">
                No hotels listed yet
              </h3>
              <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
                Standout stays will appear here once partners publish their properties.
              </p>
              <Link
                href="/hotels"
                className="inline-flex items-center gap-1.5 bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition shadow-sm"
              >
                Browse hotels
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── Partner CTA ────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-14">
        {/* Gold band carries navy type — pale-on-gold washes out */}
        <div className="rounded-3xl p-10 text-center"
          style={{ background: "linear-gradient(135deg, #DCC168 0%, #A98A22 100%)" }}>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] mb-3 text-gray-900/70">For businesses</p>
          <h2 className="font-display text-3xl font-semibold text-gray-900 mb-3">
            Host your own event?
          </h2>
          <p className="text-gray-900/80 mb-8 text-sm max-w-sm mx-auto leading-relaxed">
            Join hundreds of organizers using dontbeboringKE to sell tickets and grow their audience across Kenya.
          </p>
          <Link
            href="/auth/join"
            className="inline-block bg-gray-900 text-white font-semibold px-8 py-3 rounded-xl text-sm hover:bg-gray-800 transition shadow-sm"
          >
            Apply as a partner
          </Link>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <footer className="border-t border-gray-200 bg-surface pt-14 pb-8">
        <div className="max-w-5xl mx-auto px-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-10 mb-10">
            <div>
              <LogoMark className="h-5 w-[26.7px] text-orange-600 mb-3" />
              <p className="text-sm text-gray-500 leading-relaxed max-w-[220px]">
                Kenya&apos;s experience platform — concerts, festivals, hotels,
                restaurants and trip planning in one place.
              </p>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 mb-3">
                Contact us
              </h3>
              <ul className="space-y-2 text-sm">
                <li>
                  <a href="mailto:hello@unduguhalisinetwork.com" className="text-gray-600 hover:text-orange-600 transition">
                    hello@unduguhalisinetwork.com
                  </a>
                </li>
                <li>
                  <a
                    href="https://wa.me/254142295870"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-gray-600 hover:text-orange-600 transition"
                  >
                    <svg className="w-4 h-4 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.87 9.87 0 004.74 1.21h.005c5.46 0 9.9-4.45 9.9-9.92 0-2.65-1.03-5.14-2.9-7.01A9.86 9.86 0 0012.04 2zm0 1.67c2.24 0 4.34.87 5.92 2.46a8.26 8.26 0 012.43 5.88c0 4.59-3.75 8.32-8.36 8.32a8.3 8.3 0 01-4.23-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 01-1.27-4.4c0-4.59 3.75-8.4 8.3-8.4zm-4.6 4.66c-.16 0-.42.06-.64.31-.22.25-.85.83-.85 2.02s.87 2.34.99 2.5c.12.16 1.7 2.6 4.13 3.64.58.25 1.03.4 1.38.51.58.19 1.11.16 1.53.1.47-.07 1.43-.58 1.63-1.15.2-.56.2-1.04.14-1.15-.06-.1-.22-.16-.47-.28-.24-.13-1.44-.71-1.66-.79-.22-.08-.38-.13-.55.12-.16.25-.63.79-.77.95-.14.16-.28.18-.53.06-.24-.13-1.03-.38-1.96-1.21-.72-.65-1.21-1.44-1.35-1.69-.14-.25-.02-.38.11-.51.11-.11.24-.28.36-.42.12-.14.16-.25.24-.4.08-.16.04-.3-.02-.42-.06-.13-.55-1.36-.77-1.86-.2-.48-.4-.42-.55-.42h-.15z" />
                    </svg>
                    +254 142 295 870
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-400 mb-3">
                Legal
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                Terms, Privacy, Cookies and Refunds policies are being finalised
                and will be linked here shortly.
              </p>
            </div>
          </div>

          <div className="pt-6 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-sm text-gray-400">
              © {new Date().getFullYear()} dontbeboringKE
            </p>
            <p className="text-xs text-gray-400">Exceptional experiences across Kenya</p>
          </div>
        </div>
      </footer>
    </div>
  );
}

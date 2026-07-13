import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <span className="text-xl font-bold text-orange-600">Burch</span>
        <div className="flex gap-4 items-center">
          <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
            Sign in
          </Link>
          <Link
            href="/auth/register"
            className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
          >
            Get started
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-4xl mx-auto px-6 py-24 text-center">
        <p className="text-sm font-medium text-orange-600 mb-4 uppercase tracking-wide">
          Africa&apos;s AI-Powered Experience Platform
        </p>
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          Discover Africa&apos;s best<br />events, hotels & experiences
        </h1>
        <p className="text-lg text-gray-500 mb-10 max-w-2xl mx-auto">
          Book events, reserve hotels, and explore restaurants — all in one place.
          Powered by AI to personalise every experience.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/auth/register"
            className="bg-orange-600 text-white px-8 py-3 rounded-xl text-base font-medium hover:bg-orange-700 transition"
          >
            Start exploring
          </Link>
          <Link
            href="/events"
            className="border border-gray-200 text-gray-700 px-8 py-3 rounded-xl text-base font-medium hover:bg-gray-50 transition"
          >
            Browse events
          </Link>
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-5xl mx-auto px-6 pb-24 grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { emoji: "🎉", label: "Events" },
          { emoji: "🏨", label: "Hotels" },
          { emoji: "🍽️", label: "Restaurants" },
          { emoji: "🌍", label: "Experiences" },
        ].map(({ emoji, label }) => (
          <div
            key={label}
            className="flex flex-col items-center gap-3 p-6 rounded-2xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50 transition cursor-pointer"
          >
            <span className="text-3xl">{emoji}</span>
            <span className="text-sm font-medium text-gray-700">{label}</span>
          </div>
        ))}
      </section>
    </main>
  );
}

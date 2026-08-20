import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-surface">
      <section className="mx-auto flex max-w-7xl flex-col items-center justify-center px-6 py-24 text-center">
        <h1 className="text-6xl font-extrabold text-black">
          Discover Africa.
        </h1>

        <p className="mt-6 max-w-2xl text-xl text-gray-600">
          Hotels, Events, Restaurants, Experiences and AI-powered travel
          planning — all in one platform.
        </p>

        <div className="mt-10 flex gap-4">
          <Link
            href="/events"
            className="rounded-xl bg-red-600 px-8 py-4 font-semibold text-white transition hover:bg-red-700"
          >
            Explore Events
          </Link>

          <Link
            href="/hotels"
            className="rounded-xl border border-black px-8 py-4 font-semibold transition hover:bg-black hover:text-white"
          >
            Find Hotels
          </Link>
        </div>
      </section>
    </main>
  );
}
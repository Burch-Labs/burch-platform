import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/login");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Nav */}
      <nav className="bg-white border-b border-gray-100 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">
          Burch
        </Link>
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">{session.user?.name ?? session.user?.email}</span>
          <Link
            href="/api/auth/signout"
            className="text-sm text-gray-500 hover:text-gray-900"
          >
            Sign out
          </Link>
        </div>
      </nav>

      <main className="max-w-5xl mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Welcome back{session.user?.name ? `, ${session.user.name}` : ""}!
        </h1>
        <p className="text-gray-500 mb-8">Discover and book experiences across Africa.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { emoji: "🎉", label: "Events", href: "/events", desc: "Live shows, concerts & more" },
            { emoji: "🏨", label: "Hotels", href: "/hotels", desc: "Find the perfect stay" },
            { emoji: "🍽️", label: "Restaurants", href: "/restaurants", desc: "Book a table" },
            { emoji: "📋", label: "My Bookings", href: "/bookings", desc: "View your reservations" },
          ].map(({ emoji, label, href, desc }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl border border-gray-100 p-6 hover:border-orange-200 hover:shadow-sm transition"
            >
              <span className="text-3xl mb-3 block">{emoji}</span>
              <p className="font-semibold text-gray-900">{label}</p>
              <p className="text-sm text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}

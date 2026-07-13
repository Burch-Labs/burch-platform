import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const { role } = session.user;

  const customerLinks = [
    { emoji: "🎉", label: "Events", href: "/events", desc: "Live shows, concerts & more" },
    { emoji: "🏨", label: "Hotels", href: "/hotels", desc: "Find the perfect stay" },
    { emoji: "🍽️", label: "Restaurants", href: "/restaurants", desc: "Book a table" },
    { emoji: "📋", label: "My Bookings", href: "/bookings", desc: "View your reservations" },
  ];

  const partnerLinks = [
    { emoji: "📊", label: "Overview", href: "/partner", desc: "Your business at a glance" },
    { emoji: "🎉", label: "My Events", href: "/partner/events", desc: "Manage event listings" },
    { emoji: "🏨", label: "My Hotels", href: "/partner/hotels", desc: "Manage hotel listings" },
    { emoji: "🍽️", label: "My Restaurants", href: "/partner/restaurants", desc: "Manage restaurant listings" },
  ];

  const adminLinks = [
    { emoji: "🛡️", label: "Admin Panel", href: "/admin", desc: "Platform management" },
    { emoji: "👥", label: "Users", href: "/admin/users", desc: "Manage all users" },
    { emoji: "🤝", label: "Partners", href: "/admin/partners", desc: "Review & approve partners" },
    { emoji: "📈", label: "Analytics", href: "/admin/analytics", desc: "Platform statistics" },
  ];

  const links =
    role === "ADMIN"
      ? adminLinks
      : role === "PARTNER"
      ? partnerLinks
      : customerLinks;

  const greeting =
    role === "ADMIN"
      ? "Admin dashboard"
      : role === "PARTNER"
      ? "Partner dashboard"
      : "Welcome back";

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">{greeting}{session.user.name ? `, ${session.user.name}` : ""}!</h1>
          <p className="text-gray-500 mt-1 text-sm">
            {role === "ADMIN"
              ? "Manage the Burch platform."
              : role === "PARTNER"
              ? "Manage your listings and view bookings."
              : "Discover and book experiences across Africa."}
          </p>
        </div>

        {!session.user.emailVerified && (
          <div className="mb-6 rounded-xl bg-amber-50 border border-amber-200 px-5 py-4 flex items-start gap-3">
            <span className="text-amber-500 text-lg">⚠️</span>
            <div>
              <p className="text-sm font-medium text-amber-800">Verify your email address</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Some features are limited until you verify your email.{" "}
                <Link href="/auth/verify-email" className="underline font-medium">
                  Resend verification email
                </Link>
              </p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {links.map(({ emoji, label, href, desc }) => (
            <Link
              key={label}
              href={href}
              className="bg-white rounded-2xl border border-gray-200 p-6 hover:border-orange-300 hover:shadow-sm transition group"
            >
              <span className="text-3xl mb-3 block">{emoji}</span>
              <p className="font-semibold text-gray-900 group-hover:text-orange-600 transition">{label}</p>
              <p className="text-xs text-gray-500 mt-1">{desc}</p>
            </Link>
          ))}
        </div>

        {role === "PARTNER" && (
          <div className="mt-6">
            <Link
              href="/partner"
              className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-xl px-5 py-3 text-sm font-medium text-gray-700 hover:border-orange-300 hover:text-orange-600 transition"
            >
              Go to Partner Portal →
            </Link>
          </div>
        )}

        {role === "ADMIN" && (
          <div className="mt-6">
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 bg-orange-600 text-white rounded-xl px-5 py-3 text-sm font-semibold hover:bg-orange-700 transition"
            >
              Open Admin Panel →
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const ROLE_BADGE: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-700",
  PARTNER:  "bg-orange-100 text-orange-700",
  CUSTOMER: "bg-orange-50 text-orange-600",
};

const NAV_LINKS = [
  { href: "/events",      label: "Events" },
  { href: "/hotels",      label: "Hotels" },
  { href: "/restaurants", label: "Restaurants" },
];

export async function NavBar() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "CUSTOMER";

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40 shadow-[0_1px_3px_0_rgba(30,21,16,0.06)]">
      <div className="max-w-6xl mx-auto px-6 py-3.5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-7">
          {/* Brand logotype in display font */}
          <Link
            href="/"
            className="font-display text-xl font-semibold text-orange-600 flex-shrink-0 tracking-wide"
          >
            dontbeboring
          </Link>
          <nav className="hidden md:flex items-center gap-0.5">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition font-medium"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Concierge */}
          <Link
            href="/concierge"
            className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-200 px-3 py-1.5 rounded-full transition"
          >
            <span aria-hidden>✦</span>
            <span>AI Concierge</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              {role === "CUSTOMER" && (
                <Link
                  href="/bookings"
                  className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition font-medium"
                >
                  My bookings
                </Link>
              )}
              <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${ROLE_BADGE[role]}`}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </span>
              <Link
                href="/dashboard"
                className="hidden sm:block text-sm text-gray-500 hover:text-gray-900 transition truncate max-w-[140px]"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/auth/login"
                className="text-sm text-gray-500 hover:text-gray-900 transition font-medium px-3 py-2"
              >
                Sign in
              </Link>
              <Link
                href="/auth/register"
                className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition font-semibold shadow-sm"
              >
                Get started
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const ROLE_BADGE: Record<string, string> = {
  ADMIN:    "bg-purple-100 text-purple-700",
  PARTNER:  "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
};

const NAV_LINKS = [
  { href: "/events", label: "Events" },
  { href: "/hotels", label: "Hotels" },
  { href: "/restaurants", label: "Restaurants" },
];

export async function NavBar() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "CUSTOMER";

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-xl font-bold text-orange-600 flex-shrink-0">
            Burch
          </Link>
          <nav className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {/* AI Concierge link */}
          <Link
            href="/concierge"
            className="hidden sm:flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 hover:bg-orange-100 border border-orange-100 px-3 py-1.5 rounded-full transition"
          >
            <span>✦</span>
            <span>AI Concierge</span>
          </Link>

          {session ? (
            <div className="flex items-center gap-3">
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[role]}`}>
                {role.charAt(0) + role.slice(1).toLowerCase()}
              </span>
              <Link
                href="/dashboard"
                className="hidden sm:block text-sm text-gray-600 hover:text-gray-900 truncate max-w-[140px]"
              >
                {session.user.name ?? session.user.email}
              </Link>
              <SignOutButton />
            </div>
          ) : (
            <div className="flex items-center gap-2">
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
          )}
        </div>
      </div>
    </header>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignOutButton } from "./SignOutButton";

const NAV_LINKS = [
  { href: "/events",      label: "Events" },
  { href: "/hotels",      label: "Hotels" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/clubs",       label: "Golf & Clubs" },
];

interface Props {
  isSignedIn: boolean;
  isCustomer: boolean;
  isAdmin: boolean;
  userLabel?: string | null;
}

/**
 * Everything the desktop nav shows across a search bar, role badge, and a
 * row of "hidden sm:block" links — collapsed into one panel a thumb can
 * reach. Without this, a phone visitor has no way to reach Events, Hotels,
 * Restaurants, or Golf & Clubs at all: the desktop nav hides that whole row
 * below the md breakpoint with nothing standing in for it.
 */
export function MobileMenu({ isSignedIn, isCustomer, isAdmin, userLabel }: Props) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Close on navigation so the panel never lingers over the new page.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="md:hidden">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={open ? "Close menu" : "Open menu"}
        className="flex items-center justify-center h-10 w-10 -mr-2 text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-lg transition"
      >
        {open ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        )}
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full bg-white border-b border-gray-200 shadow-lg z-50">
          <nav className="max-w-6xl mx-auto px-6 py-3 flex flex-col">
            {NAV_LINKS.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-base text-gray-700 hover:text-orange-600 py-3 border-b border-gray-50 font-medium"
              >
                {label}
              </Link>
            ))}
            <Link href="/concierge" className="text-base text-orange-600 py-3 border-b border-gray-50 font-semibold">
              ✦ AI Concierge
            </Link>
            <Link href="/events/submit" className="text-base text-gray-700 hover:text-orange-600 py-3 border-b border-gray-50 font-medium">
              List your event
            </Link>

            {isSignedIn ? (
              <>
                {isCustomer && (
                  <>
                    <Link href="/tickets" className="text-base text-gray-700 hover:text-orange-600 py-3 border-b border-gray-50 font-medium">
                      My tickets
                    </Link>
                    <Link href="/bookings" className="text-base text-gray-700 hover:text-orange-600 py-3 border-b border-gray-50 font-medium">
                      My bookings
                    </Link>
                  </>
                )}
                {isAdmin && (
                  <Link href="/admin" className="text-base text-purple-600 hover:text-purple-800 py-3 border-b border-gray-50 font-semibold">
                    Admin
                  </Link>
                )}
                <Link href="/dashboard" className="text-base text-gray-700 hover:text-orange-600 py-3 border-b border-gray-50 font-medium truncate">
                  {userLabel ?? "Dashboard"}
                </Link>
                <Link href="/settings" className="text-base text-gray-500 hover:text-gray-900 py-3 border-b border-gray-50">
                  Settings
                </Link>
                <div className="py-3">
                  <SignOutButton />
                </div>
              </>
            ) : (
              <div className="flex flex-col gap-2 py-3">
                <Link
                  href="/auth/join"
                  className="text-center text-sm text-gray-700 border border-gray-200 px-4 py-2.5 rounded-lg font-medium"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/join"
                  className="text-center text-sm bg-orange-600 text-white px-4 py-2.5 rounded-lg font-semibold"
                >
                  Get started
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </div>
  );
}

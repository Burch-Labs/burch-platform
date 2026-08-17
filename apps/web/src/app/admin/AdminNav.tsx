import Link from "next/link";

const TABS = [
  { href: "/admin",          label: "Office"   },
  { href: "/admin/payouts",  label: "Payouts"  },
  { href: "/admin/partners", label: "Partners" },
  { href: "/admin/events",   label: "Events"   },
  { href: "/admin/claims",   label: "Claims"   },
  { href: "/admin/reports",  label: "Reports"  },
];

/**
 * One bar across the admin tools.
 *
 * Counts sit on the tabs because the queues are the reason to open this section
 * at all — an admin should be able to see there is nothing waiting without
 * clicking into three pages to find out.
 */
export function AdminNav({
  active,
  counts,
}: {
  active: string;
  counts?: Partial<Record<string, number>>;
}) {
  return (
    <nav className="flex gap-1 mb-8 border-b border-gray-200 overflow-x-auto">
      {TABS.map(({ href, label }) => {
        const isActive = href === active;
        const count = counts?.[href];
        return (
          <Link
            key={href}
            href={href}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition whitespace-nowrap flex-shrink-0 ${
              isActive
                ? "border-orange-600 text-orange-700"
                : "border-transparent text-gray-500 hover:text-gray-900"
            }`}
          >
            {label}
            {count ? (
              <span className="ml-2 text-xs font-semibold bg-orange-100 text-orange-800 px-1.5 py-0.5 rounded-full">
                {count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}

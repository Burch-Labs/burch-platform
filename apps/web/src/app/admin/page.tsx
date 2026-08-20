import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "./AdminNav";
import { getQueueCounts } from "./queue-counts";
import { getRecentActivity } from "./activity";
import Link from "next/link";

export const metadata = { title: "Admin office — dontbeboringKE" };
export const dynamic = "force-dynamic";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
}

export default async function AdminOfficePage() {
  const [counts, activity, revenue, ticketsSold, activePartners, topEvents] = await Promise.all([
    getQueueCounts(),
    getRecentActivity(20),
    prisma.payment.aggregate({ where: { status: "SUCCESS" }, _sum: { amount: true } }),
    prisma.ticket.count({ where: { status: { not: "VOID" } } }),
    prisma.partner.count({ where: { status: "APPROVED" } }),
    prisma.event.findMany({
      where: { published: true },
      orderBy: { viewCount: "desc" },
      take: 5,
      select: { id: true, title: true, viewCount: true, _count: { select: { tickets: true } } },
    }),
  ]);

  const pendingTotal = Object.values(counts).reduce((sum, n) => sum + (n ?? 0), 0);
  const totalRevenue = Number(revenue._sum.amount ?? 0);

  const tiles = [
    { label: "Revenue collected", value: `KES ${totalRevenue.toLocaleString()}`, emoji: "💰" },
    { label: "Tickets sold", value: ticketsSold.toLocaleString(), emoji: "🎫" },
    { label: "Active partners", value: activePartners.toLocaleString(), emoji: "🏢" },
    { label: "Waiting for review", value: pendingTotal.toLocaleString(), emoji: "⏳", href: pendingTotal > 0 ? "/admin/events" : undefined },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Admin office</h1>
        <p className="text-sm text-gray-500 mb-6">Everything happening across the platform, in one place.</p>

        <AdminNav active="/admin" counts={counts} />

        {/* KPI tiles */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {tiles.map(({ label, value, emoji, href }) => {
            const content = (
              <div className="bg-surface rounded-2xl border border-gray-100 p-5">
                <span className="text-xl">{emoji}</span>
                <p className="text-xl font-bold text-gray-900 mt-2">{value}</p>
                <p className="text-xs text-gray-500 mt-0.5">{label}</p>
              </div>
            );
            return href ? (
              <Link key={label} href={href} className="hover:border-orange-200 transition rounded-2xl">
                {content}
              </Link>
            ) : (
              <div key={label}>{content}</div>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Activity feed */}
          <div className="lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-900 mb-3">Recent activity</h2>
            {activity.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-gray-100 p-8 text-center">
                <p className="text-sm text-gray-500">Nothing has happened yet.</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {activity.map((item) => {
                  const row = (
                    <div className="flex items-start gap-3 px-5 py-3.5">
                      <span className="text-lg leading-none mt-0.5">{item.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-gray-900">{item.text}</p>
                        <p className="text-xs text-gray-400 mt-0.5">{timeAgo(item.at)}</p>
                      </div>
                    </div>
                  );
                  return item.href ? (
                    <Link key={item.id} href={item.href} className="block hover:bg-gray-50 transition">
                      {row}
                    </Link>
                  ) : (
                    <div key={item.id}>{row}</div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Top events */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-900">Top events</h2>
              <Link href="/admin/reports" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
                Full report →
              </Link>
            </div>
            {topEvents.length === 0 ? (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6 text-center">
                <p className="text-sm text-gray-500">No published events yet.</p>
              </div>
            ) : (
              <div className="bg-surface rounded-2xl border border-gray-100 divide-y divide-gray-50">
                {topEvents.map((e) => (
                  <div key={e.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-900 truncate">{e.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {e.viewCount.toLocaleString()} view{e.viewCount !== 1 ? "s" : ""} · {e._count.tickets} ticket{e._count.tickets !== 1 ? "s" : ""} sold
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

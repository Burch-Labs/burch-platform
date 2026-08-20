import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";

export const metadata = { title: "Event reports — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function AdminReportsPage() {
  const [events, revenueByEvent, counts] = await Promise.all([
    prisma.event.findMany({
      orderBy: { viewCount: "desc" },
      select: {
        id: true,
        title: true,
        published: true,
        approvalStatus: true,
        viewCount: true,
        capacity: true,
        partner: { select: { name: true } },
        _count: { select: { tickets: true } },
      },
    }),
    prisma.booking.groupBy({
      by: ["eventId"],
      where: { eventId: { not: null }, status: { in: ["CONFIRMED", "COMPLETED"] } },
      _sum: { totalAmount: true },
    }),
    getQueueCounts(),
  ]);

  const revenueByEventId = new Map(
    revenueByEvent.map((r) => [r.eventId as string, Number(r._sum.totalAmount ?? 0)])
  );

  const totalViews = events.reduce((sum, e) => sum + e.viewCount, 0);
  const totalTickets = events.reduce((sum, e) => sum + e._count.tickets, 0);
  const totalRevenue = [...revenueByEventId.values()].reduce((sum, v) => sum + v, 0);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Event reports</h1>
        <p className="text-sm text-gray-500 mb-6">
          Views, tickets, and confirmed booking revenue for every event on the platform.
        </p>

        <AdminNav active="/admin/reports" counts={counts} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-surface rounded-2xl border border-gray-100 p-5">
            <p className="text-xl font-bold text-gray-900">{totalViews.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Total views</p>
          </div>
          <div className="bg-surface rounded-2xl border border-gray-100 p-5">
            <p className="text-xl font-bold text-gray-900">{totalTickets.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Tickets sold</p>
          </div>
          <div className="bg-surface rounded-2xl border border-gray-100 p-5">
            <p className="text-xl font-bold text-gray-900">KES {totalRevenue.toLocaleString()}</p>
            <p className="text-xs text-gray-500 mt-0.5">Confirmed booking revenue</p>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-500">No events yet.</p>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-100 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-left text-xs text-gray-400 uppercase tracking-wide">
                    <th className="px-5 py-3 font-medium">Event</th>
                    <th className="px-5 py-3 font-medium">Organizer</th>
                    <th className="px-5 py-3 font-medium text-right">Views</th>
                    <th className="px-5 py-3 font-medium text-right">Tickets</th>
                    <th className="px-5 py-3 font-medium text-right">Revenue</th>
                    <th className="px-5 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {events.map((e) => (
                    <tr key={e.id}>
                      <td className="px-5 py-3 font-medium text-gray-900 max-w-xs truncate">{e.title}</td>
                      <td className="px-5 py-3 text-gray-500">{e.partner.name}</td>
                      <td className="px-5 py-3 text-right text-gray-700">{e.viewCount.toLocaleString()}</td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        {e._count.tickets} / {e.capacity}
                      </td>
                      <td className="px-5 py-3 text-right text-gray-700">
                        KES {(revenueByEventId.get(e.id) ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <span
                          className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                            e.approvalStatus === "PENDING"
                              ? "bg-amber-50 text-amber-700 border-amber-200"
                              : e.approvalStatus === "REJECTED"
                              ? "bg-red-50 text-red-700 border-red-200"
                              : e.published
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {e.approvalStatus === "PENDING"
                            ? "Pending"
                            : e.approvalStatus === "REJECTED"
                            ? "Rejected"
                            : e.published
                            ? "Published"
                            : "Draft"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

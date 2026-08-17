import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";
import { SuspendControls } from "./SuspendControls";
import { CommissionControls } from "./CommissionControls";
import { DEFAULT_COMMISSION_RATE } from "@/lib/commission";

export const metadata = { title: "Partners — dontbeboring" };
export const dynamic = "force-dynamic";

export default async function AdminPartnersPage() {
  const [partners, counts] = await Promise.all([
    prisma.partner.findMany({
      orderBy: [{ status: "asc" }, { name: "asc" }],
      include: {
        user: { select: { email: true } },
        payoutAccount: { select: { status: true } },
        _count: { select: { events: true, hotels: true, restaurants: true, clubs: true } },
      },
    }),
    getQueueCounts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Partners</h1>
        <p className="text-sm text-gray-500 mb-6">
          Suspending hides a partner&apos;s listings and stops their payouts.
        </p>

        <AdminNav active="/admin/partners" counts={counts} />

        {partners.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-500">No partners yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {partners.map((p) => {
              const listings =
                p._count.events + p._count.hotels + p._count.restaurants + p._count.clubs;
              const suspended = p.status === "SUSPENDED";
              return (
                <div
                  key={p.id}
                  className={`bg-white rounded-2xl border p-6 ${
                    suspended ? "border-red-200" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{p.name}</p>
                      <p className="text-sm text-gray-400">{p.user.email}</p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                        suspended
                          ? "bg-red-50 text-red-700"
                          : "bg-green-50 text-green-700"
                      }`}
                    >
                      {suspended ? "Suspended" : "Active"}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500 mb-3">
                    {listings} listing{listings !== 1 ? "s" : ""}
                    {" · payouts "}
                    {p.payoutAccount?.status
                      ? p.payoutAccount.status.toLowerCase().replace("_", " ")
                      : "not set up"}
                  </p>

                  {suspended && p.suspendedReason && (
                    <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-lg px-3 py-2 mb-3">
                      {p.suspendedReason}
                    </p>
                  )}

                  <div className="mb-3">
                    <CommissionControls
                      partnerId={p.id}
                      rate={Number(p.commissionRate)}
                      isDefault={Number(p.commissionRate) === DEFAULT_COMMISSION_RATE}
                    />
                  </div>

                  <SuspendControls partnerId={p.id} suspended={suspended} />
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

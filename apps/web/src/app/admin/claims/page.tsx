import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";
import { ClaimControls } from "./ClaimControls";

export const metadata = { title: "Listing claims — dontbeboringKE" };
export const dynamic = "force-dynamic";

const PATH = { HOTEL: "hotels", RESTAURANT: "restaurants", CLUB: "clubs" } as const;

export default async function AdminClaimsPage() {
  const [open, closed, counts] = await Promise.all([
    prisma.venueClaim.findMany({
      where: { status: { in: ["NEW", "CONTACTED"] } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.venueClaim.findMany({
      where: { status: { in: ["APPROVED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
    }),
    getQueueCounts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Listing claims</h1>
        <p className="text-sm text-gray-500 mb-6">
          People saying they work at a venue we listed. These are the only inbound partner
          leads the site generates.
        </p>

        <AdminNav active="/admin/claims" counts={counts} />

        {open.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-gray-100 p-10 text-center mb-10">
            <p className="text-sm text-gray-500">No open claims.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {open.map((c) => (
              <div key={c.id} className="bg-surface rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <Link
                      href={`/${PATH[c.venueType]}/${c.venueId}`}
                      className="font-semibold text-gray-900 hover:text-orange-600 transition"
                    >
                      {c.venueName}
                    </Link>
                    <p className="text-sm text-gray-400">
                      {c.contactName} · {c.role}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 bg-gray-100 text-gray-600">
                    {c.status === "NEW" ? "New" : "Contacted"}
                  </span>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-4 text-sm">
                  <Row label="Email" value={c.workEmail} />
                  <Row label="Phone" value={c.phone} />
                  {c.website && <Row label="Booking page" value={c.website} />}
                  <Row
                    label="Claimed"
                    value={c.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  />
                </dl>

                <ClaimControls claimId={c.id} />
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recently closed</h2>
        {closed.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing closed yet.</p>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {closed.map((c) => (
              <div key={c.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-900 truncate">
                  {c.venueName} <span className="text-gray-400">· {c.contactName}</span>
                </p>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    c.status === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {c.status === "APPROVED" ? "Confirmed" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 truncate">{value}</dd>
    </div>
  );
}

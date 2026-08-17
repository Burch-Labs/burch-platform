import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { ReviewControls } from "./ReviewControls";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";

export const metadata = { title: "Payout reviews — dontbeboringKE" };
export const dynamic = "force-dynamic";

/**
 * The queue of partners waiting to be paid.
 *
 * Shows submitted accounts in full — an approval is a judgement about whether
 * this person is who they say, so the reviewer needs the details in front of
 * them, unmasked. Access is admin-only via middleware and re-checked in the
 * action itself.
 */
export default async function AdminPayoutsPage() {
  const [pending, decided, counts] = await Promise.all([
    prisma.payoutAccount.findMany({
      where: { status: "SUBMITTED" },
      orderBy: { submittedAt: "asc" },
      include: { partner: { select: { id: true, name: true, user: { select: { email: true } } } } },
    }),
    prisma.payoutAccount.findMany({
      where: { status: { in: ["VERIFIED", "REJECTED"] } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { partner: { select: { name: true } } },
    }),
    getQueueCounts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Payout reviews</h1>
        <p className="text-sm text-gray-500 mb-8">
          Partners list and sell without this. Approving one lets money reach them.
        </p>

        <AdminNav active="/admin/payouts" counts={counts} />

        <h2 className="text-sm font-semibold text-gray-900 mb-3">
          Awaiting review {pending.length > 0 && <span className="text-gray-400">({pending.length})</span>}
        </h2>

        {pending.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center mb-10">
            <p className="text-gray-500 text-sm">Nothing waiting. Everything submitted has been decided.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {pending.map((a) => (
              <div key={a.id} className="bg-white rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{a.partner.name}</p>
                    <p className="text-sm text-gray-400">{a.partner.user.email}</p>
                  </div>
                  <p className="text-xs text-gray-400 flex-shrink-0">
                    {a.submittedAt?.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </div>

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 mb-5 text-sm">
                  <Row label="Legal name" value={a.legalName} />
                  <Row label="KRA PIN" value={a.taxId} />
                  <Row label="ID / registration" value={a.idNumber} />
                  <Row label="M-Pesa" value={a.mpesaNumber} />
                  <Row label="Bank" value={a.bankName} />
                  <Row label="Account" value={a.bankAccount} />
                </dl>

                <ReviewControls partnerId={a.partner.id} />
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recently decided</h2>
        {decided.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing decided yet.</p>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {decided.map((a) => (
              <div key={a.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 truncate">{a.partner.name}</p>
                  {a.rejectionReason && (
                    <p className="text-xs text-gray-400 truncate">{a.rejectionReason}</p>
                  )}
                </div>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    a.status === "VERIFIED"
                      ? "bg-green-50 text-green-700"
                      : "bg-gray-100 text-gray-600"
                  }`}
                >
                  {a.status === "VERIFIED" ? "Approved" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-3">
      <dt className="text-gray-400">{label}</dt>
      <dd className="font-medium text-gray-900 truncate">{value}</dd>
    </div>
  );
}

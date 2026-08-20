import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";
import { EventReviewControls } from "./EventReviewControls";
import { FeaturedToggle } from "./FeaturedToggle";

export const metadata = { title: "Event submissions — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) redirect("/dashboard?error=unauthorized");

  const canReview = isSuperAdmin(session.user.role);

  const [pending, reviewed, counts] = await Promise.all([
    prisma.event.findMany({
      where: { approvalStatus: "PENDING" },
      orderBy: { createdAt: "asc" },
      include: { partner: { select: { name: true } } },
    }),
    prisma.event.findMany({
      where: { approvalStatus: { in: ["APPROVED", "REJECTED"] }, reviewedAt: { not: null } },
      orderBy: { reviewedAt: "desc" },
      take: 20,
      include: { partner: { select: { name: true } } },
    }),
    getQueueCounts(),
  ]);

  const published = await prisma.event.findMany({
    where: { published: true },
    orderBy: [{ isFeatured: "desc" }, { startDate: "asc" }],
    include: { partner: { select: { name: true } } },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Event submissions</h1>
        <p className="text-sm text-gray-500 mb-6">
          Events submitted through the public listing form. Nothing here appears on the site
          until it's approved.
        </p>

        <AdminNav active="/admin/events" counts={counts} />

        {pending.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-gray-100 p-10 text-center mb-10">
            <p className="text-sm text-gray-500">Nothing waiting for review.</p>
          </div>
        ) : (
          <div className="space-y-4 mb-10">
            {pending.map((event) => (
              <div key={event.id} className="bg-surface rounded-2xl border border-gray-100 p-6">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900">{event.title}</p>
                    <p className="text-sm text-gray-400">
                      {event.partner.name} · {event.city}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 bg-amber-50 text-amber-700 border border-amber-200">
                    Pending
                  </span>
                </div>

                {event.images.length > 0 && (
                  <div className="flex gap-2 mb-4 overflow-x-auto">
                    {event.images.map((url) => (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        key={url}
                        src={url}
                        alt={event.title}
                        className="h-20 w-28 object-cover rounded-lg border border-gray-200 flex-shrink-0"
                      />
                    ))}
                  </div>
                )}

                {event.description && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-3">{event.description}</p>
                )}

                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 mb-4 text-sm">
                  <Row label="Venue" value={event.location} />
                  <Row
                    label="Dates"
                    value={`${event.startDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${event.endDate.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`}
                  />
                  <Row label="Rate" value={`${event.currency} ${Number(event.price).toLocaleString()}`} />
                  <Row label="Capacity" value={String(event.capacity)} />
                  <Row
                    label="Terms accepted"
                    value={
                      event.termsAcceptedAt
                        ? event.termsAcceptedAt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                        : "Not recorded"
                    }
                  />
                  <Row
                    label="Submitted"
                    value={event.createdAt.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  />
                </dl>

                <EventReviewControls eventId={event.id} canReview={canReview} />
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-900 mb-3">Recently reviewed</h2>
        {reviewed.length === 0 ? (
          <p className="text-sm text-gray-400">Nothing reviewed yet.</p>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {reviewed.map((event) => (
              <div key={event.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-900 truncate">
                  {event.title} <span className="text-gray-400">· {event.partner.name}</span>
                </p>
                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
                    event.approvalStatus === "APPROVED"
                      ? "bg-green-50 text-green-700"
                      : "bg-red-50 text-red-700"
                  }`}
                >
                  {event.approvalStatus === "APPROVED" ? "Approved" : "Rejected"}
                </span>
              </div>
            ))}
          </div>
        )}

        <h2 className="text-sm font-semibold text-gray-900 mb-1 mt-10">Top Picks</h2>
        <p className="text-sm text-gray-500 mb-3">
          Curate which live events show in the homepage &quot;Top Picks&quot; row. Doesn&apos;t affect whether an event is published.
        </p>
        {published.length === 0 ? (
          <p className="text-sm text-gray-400">No published events yet.</p>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-100 divide-y divide-gray-50">
            {published.map((event) => (
              <div key={event.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-900 truncate">
                  {event.title} <span className="text-gray-400">· {event.partner.name}</span>
                </p>
                <FeaturedToggle eventId={event.id} initial={event.isFeatured} />
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

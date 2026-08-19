import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { DeleteEventButton } from "./DeleteEventButton";
import { isAdminRole } from "@/lib/roles";

export default async function PartnerEventsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  const events = await prisma.event.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      city: true,
      startDate: true,
      published: true,
      category: true,
      approvalStatus: true,
      rejectionReason: true,
      _count: { select: { bookings: true } },
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Events</h1>
            <p className="text-sm text-gray-500 mt-1">{events.length} event{events.length !== 1 ? "s" : ""}</p>
          </div>
          <div className="flex gap-3">
            <Link href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
              ← Partner Portal
            </Link>
            <Link
              href="/partner/events/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              + New event
            </Link>
          </div>
        </div>

        {events.length === 0 ? (
          <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-8 py-14 text-center">
            <p className="text-4xl mb-4">🎉</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No events yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              Create your first event and it will appear on the dontbeboringKE homepage immediately after publishing.
            </p>
            <Link
              href="/partner/events/new"
              className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Create event
            </Link>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {events.map((event) => (
              <div key={event.id} className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{event.title}</p>
                    <span
                      className={`shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                        event.approvalStatus === "PENDING"
                          ? "bg-amber-50 text-amber-700 border-amber-200"
                          : event.approvalStatus === "REJECTED"
                          ? "bg-red-50 text-red-700 border-red-200"
                          : event.published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {event.approvalStatus === "PENDING"
                        ? "Pending review"
                        : event.approvalStatus === "REJECTED"
                        ? "Rejected"
                        : event.published
                        ? "Published"
                        : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {event.city} · {event.startDate.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" })} · {event._count.bookings} booking{event._count.bookings !== 1 ? "s" : ""}
                  </p>
                  {event.approvalStatus === "REJECTED" && event.rejectionReason && (
                    <p className="text-xs text-red-600 mt-0.5">{event.rejectionReason}</p>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/partner/events/${event.id}/edit`}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                  >
                    Edit
                  </Link>
                  <DeleteEventButton eventId={event.id} eventTitle={event.title} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

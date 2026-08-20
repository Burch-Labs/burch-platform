import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export const metadata = { title: "My tickets — dontbeboringKE" };
export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-KE", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default async function MyTicketsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const bookings = await prisma.booking.findMany({
    where: { userId: session.user.id, type: "EVENT", tickets: { some: {} } },
    select: {
      id: true,
      status: true,
      event: {
        select: { id: true, title: true, location: true, city: true, startDate: true, imageUrl: true },
      },
      tickets: { select: { id: true, status: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const upcoming = bookings.filter((b) => b.event && b.event.startDate >= now);
  const past = bookings.filter((b) => !b.event || b.event.startDate < now);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My tickets</h1>
            <p className="text-gray-500 mt-1 text-sm">
              Open a ticket at the door — the code on it is what gets you in.
            </p>
          </div>
          <Link href="/bookings" className="text-xs text-orange-600 hover:text-orange-700 font-medium">
            Stays &amp; tables →
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-dashed border-gray-200 px-6 py-14 text-center">
            <p className="text-3xl mb-2">🎟️</p>
            <p className="text-sm text-gray-600 font-medium">No tickets yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Tickets appear here the moment your payment clears.
            </p>
            <Link
              href="/events"
              className="inline-block mt-4 text-xs font-medium text-orange-600 hover:underline"
            >
              Find something to do
            </Link>
          </div>
        ) : (
          <div className="space-y-10">
            <Section title="Upcoming" bookings={upcoming} empty="Nothing coming up." />
            {past.length > 0 && <Section title="Past" bookings={past} empty="" />}
          </div>
        )}
      </main>
    </div>
  );
}

type Row = {
  id: string;
  status: string;
  event: {
    id: string;
    title: string;
    location: string;
    city: string;
    startDate: Date;
    imageUrl: string | null;
  } | null;
  tickets: { id: string; status: string }[];
};

function Section({ title, bookings, empty }: { title: string; bookings: Row[]; empty: string }) {
  return (
    <section>
      <h2 className="text-base font-semibold text-gray-900 mb-4">
        {title}
        <span className="ml-2 text-xs font-normal text-gray-400">({bookings.length})</span>
      </h2>
      {bookings.length === 0 ? (
        <p className="text-sm text-gray-400 bg-surface rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
          {empty}
        </p>
      ) : (
        <div className="space-y-3">
          {bookings.map((b) => {
            const usable = b.tickets.filter((t) => t.status === "VALID").length;
            return (
              <Link
                key={b.id}
                href={`/tickets/${b.id}`}
                className="block bg-surface rounded-xl border border-gray-100 p-4 flex items-center gap-4 hover:border-orange-300 transition-colors"
              >
                {b.event?.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={b.event.imageUrl}
                    alt=""
                    className="w-14 h-14 rounded-lg object-cover flex-shrink-0"
                  />
                ) : (
                  <span className="w-14 h-14 rounded-lg bg-gray-50 flex items-center justify-center text-xl flex-shrink-0">
                    🎟️
                  </span>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {b.event?.title ?? "Event"}
                  </p>
                  <p className="text-xs text-gray-400 mt-0.5 truncate">
                    {b.event
                      ? `${fmtDate(b.event.startDate)} at ${fmtTime(b.event.startDate)} · ${b.event.location}`
                      : "Details unavailable"}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {b.tickets.length} ticket{b.tickets.length !== 1 ? "s" : ""}
                  </p>
                  <p className="text-xs text-gray-400">
                    {usable === b.tickets.length ? "Ready" : `${usable} unused`}
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </section>
  );
}

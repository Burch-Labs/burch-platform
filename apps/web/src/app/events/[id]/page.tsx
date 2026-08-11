import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { EventGrid } from "@/components/events/EventGrid";
import { OrganizerCard } from "@/components/events/OrganizerCard";
import { TicketSelector } from "@/components/events/TicketSelector";
import { Badge } from "@/components/ui/Badge";
import {
  CATEGORY_LABELS,
  CATEGORY_COLORS,
} from "@/types/events";
import {
  formatDateRange,
  formatCurrency,
  ticketsRemaining,
} from "@/lib/format";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const event = await prisma.event.findUnique({
    where: { id },
    select: { title: true, description: true },
  });
  if (!event) return { title: "Event not found" };
  return {
    title: `${event.title} — Burch`,
    description: event.description ?? undefined,
  };
}

export default async function EventDetailPage({ params }: PageProps) {
  const { id } = await params;

  const [session, event] = await Promise.all([
    getServerSession(authOptions),
    prisma.event.findUnique({
      where: { id, published: true },
      include: {
        partner: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { events: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
    }),
  ]);

  if (!event) notFound();

  // Related events
  const related = await prisma.event.findMany({
    where: {
      published: true,
      category: event.category,
      id: { not: event.id },
      startDate: { gte: new Date() },
    },
    include: {
      partner: {
        select: {
          id: true, name: true, logoUrl: true,
          user: { select: { id: true, name: true, image: true } },
        },
      },
      _count: { select: { bookings: true } },
    },
    orderBy: { startDate: "asc" },
    take: 3,
  });

  const totalBooked = await prisma.booking.aggregate({
    where: { eventId: id },
    _sum: { quantity: true },
  });
  const booked = totalBooked._sum.quantity ?? 0;
  const remaining = ticketsRemaining(event.capacity, booked);

  const colors = CATEGORY_COLORS[event.category];
  const price = Number(event.price);
  const loginUrl = `/auth/login?callbackUrl=/events/${id}`;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Hero */}
      <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            priority
            // Proxy-served images (/api/images/…) are already optimised and
            // cached by the route handler; skip Next.js image optimisation so
            // the optimizer doesn't try to re-fetch them via localhost.
            unoptimized={event.imageUrl.startsWith("/api/images/")}
            className="object-cover"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colors.gradient}`} />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        {/* Breadcrumb */}
        <div className="absolute top-4 left-0 right-0 px-6 max-w-6xl mx-auto">
          <Link href="/events" className="text-white/80 text-sm hover:text-white">
            ← Back to events
          </Link>
        </div>

        {/* Title overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-6 pb-6 max-w-6xl mx-auto">
          <Badge className={`${colors.bg} ${colors.text} mb-3`}>
            {CATEGORY_LABELS[event.category]}
          </Badge>
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white leading-tight">
            {event.title}
          </h1>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Left: details */}
          <div className="flex-1 min-w-0 space-y-6">
            {/* Key info strip */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  ),
                  label: "Date & Time",
                  value: formatDateRange(event.startDate, event.endDate),
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  ),
                  label: "Location",
                  value: `${event.location}${event.city ? `, ${event.city}` : ""}`,
                },
                {
                  icon: (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                  ),
                  label: "Price",
                  value: formatCurrency(price, event.currency),
                },
              ].map(({ icon, label, value }) => (
                <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-3">
                  <div className="w-9 h-9 rounded-lg bg-orange-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      {icon}
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-gray-500 font-medium">{label}</p>
                    <p className="text-sm font-semibold text-gray-900 mt-0.5 leading-snug">{value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Description */}
            {event.description && (
              <div className="bg-white rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About this event</h2>
                <div className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {event.description}
                </div>
              </div>
            )}

            {/* Tags */}
            {event.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {event.tags.map((tag) => (
                  <Badge key={tag} variant="outline" className="border-gray-200 text-gray-500">
                    #{tag}
                  </Badge>
                ))}
              </div>
            )}

            {/* Organizer */}
            <OrganizerCard partner={event.partner} />

            {/* Related events */}
            {related.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  More {CATEGORY_LABELS[event.category]} events
                </h2>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <EventGrid events={related as any} />
              </div>
            )}
          </div>

          {/* Right: ticket sidebar */}
          <div className="lg:w-72 flex-shrink-0">
            <div className="sticky top-20 space-y-4">
              <TicketSelector
                eventId={event.id}
                price={price}
                currency={event.currency}
                remaining={remaining}
                isAuthenticated={!!session}
                loginUrl={loginUrl}
              />

              {/* Capacity info */}
              <div className="bg-white rounded-2xl border border-gray-100 p-4">
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Tickets sold</span>
                  <span className="font-medium text-gray-900">
                    {booked} / {event.capacity}
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-orange-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${Math.min(100, (booked / event.capacity) * 100)}%` }}
                  />
                </div>
                {remaining <= 10 && remaining > 0 && (
                  <p className="text-xs text-amber-600 mt-2 font-medium">
                    ⚡ Only {remaining} tickets left!
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

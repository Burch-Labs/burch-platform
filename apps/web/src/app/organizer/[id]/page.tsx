import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { EventGrid } from "@/components/events/EventGrid";
import Image from "next/image";
import Link from "next/link";

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const partner = await prisma.partner.findUnique({
    where: { id },
    select: { name: true },
  });
  if (!partner) return { title: "Organizer not found" };
  return { title: `${partner.name} — dontbeboring` };
}

export default async function OrganizerPage({ params }: PageProps) {
  const { id } = await params;

  const organizer = await prisma.partner.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, name: true, image: true } },
      events: {
        where: { published: true, startDate: { gte: new Date() } },
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
      },
      _count: { select: { events: true } },
    },
  });

  if (!organizer) notFound();

  const initials = organizer.name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      {/* Header banner */}
      <div className="bg-gradient-to-br from-orange-500 to-orange-600 h-40" />

      <main className="max-w-5xl mx-auto px-6">
        {/* Profile card — overlaps banner */}
        <div className="-mt-12 mb-8">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row gap-5 items-start sm:items-center">
              {/* Avatar */}
              {organizer.logoUrl || organizer.user.image ? (
                <Image
                  src={(organizer.logoUrl ?? organizer.user.image)!}
                  alt={organizer.name}
                  width={72}
                  height={72}
                  className="rounded-2xl object-cover border-4 border-white shadow flex-shrink-0"
                />
              ) : (
                <div className="w-18 h-18 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-2xl flex-shrink-0 border-4 border-white shadow w-[72px] h-[72px]">
                  {initials}
                </div>
              )}

              <div className="flex-1 min-w-0">
                <h1 className="text-2xl font-bold text-gray-900">{organizer.name}</h1>
                {organizer.description && (
                  <p className="text-gray-500 text-sm mt-1 leading-relaxed">
                    {organizer.description}
                  </p>
                )}
                <div className="flex flex-wrap gap-4 mt-3">
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{organizer._count.events}</span>{" "}
                    total events
                  </span>
                  <span className="text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">{organizer.events.length}</span>{" "}
                    upcoming
                  </span>
                  {organizer.website && (
                    <a
                      href={organizer.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-orange-600 hover:underline"
                    >
                      🌐 Website
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Events section */}
        <div className="pb-12">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-bold text-gray-900">Upcoming events</h2>
            <Link href="/events" className="text-sm text-orange-600 hover:underline">
              Browse all events
            </Link>
          </div>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <EventGrid
            events={organizer.events as any}
            emptyMessage="This organizer has no upcoming events right now."
          />
        </div>
      </main>
    </div>
  );
}

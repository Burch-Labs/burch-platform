import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { HappeningsManager } from "@/components/venues/HappeningsManager";
import {
  createHappening, updateHappening, deleteHappening,
  createSpaOffer, updateSpaOffer, deleteSpaOffer,
} from "./actions";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminHotelHappeningsPage({ params }: Props) {
  const { id } = await params;

  const hotel = await prisma.hotel.findUnique({
    where: { id },
    select: {
      id: true,
      name: true,
      city: true,
      happenings: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          flyerUrl: true,
          startsAt: true,
          endsAt: true,
          published: true,
          isFeatured: true,
        },
      },
      spaOffers: {
        orderBy: { createdAt: "desc" },
        select: {
          id: true,
          title: true,
          description: true,
          flyerUrl: true,
          startsAt: true,
          endsAt: true,
          published: true,
          isFeatured: true,
        },
      },
    },
  });
  if (!hotel) notFound();

  const happenings = hotel.happenings.map((h) => ({
    ...h,
    startsAt: h.startsAt ? h.startsAt.toISOString() : null,
    endsAt: h.endsAt ? h.endsAt.toISOString() : null,
  }));
  const spaOffers = hotel.spaOffers.map((o) => ({
    ...o,
    startsAt: o.startsAt ? o.startsAt.toISOString() : null,
    endsAt: o.endsAt ? o.endsAt.toISOString() : null,
  }));

  const boundCreate = createHappening.bind(null, hotel.id);
  const updateActions = Object.fromEntries(
    happenings.map((h) => [h.id, updateHappening.bind(null, hotel.id, h.id)])
  );
  const boundDelete = deleteHappening.bind(null, hotel.id);

  const boundCreateSpa = createSpaOffer.bind(null, hotel.id);
  const spaUpdateActions = Object.fromEntries(
    spaOffers.map((o) => [o.id, updateSpaOffer.bind(null, hotel.id, o.id)])
  );
  const boundDeleteSpa = deleteSpaOffer.bind(null, hotel.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link href="/admin/hotels" className="text-sm text-gray-500 hover:text-gray-700">
            ← All hotels
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[240px]">{hotel.name}</h1>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Happenings</h2>
            <p className="text-sm text-gray-500 mt-1">
              {happenings.length} happening{happenings.length !== 1 ? "s" : ""} · {hotel.name}
              {hotel.city ? ` · ${hotel.city}` : ""}
            </p>
          </div>
          <Link
            href={`/hotels/${hotel.id}#happenings`}
            target="_blank"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition"
          >
            View public page ↗
          </Link>
        </div>

        <HappeningsManager
          happenings={happenings}
          createAction={boundCreate}
          updateActions={updateActions}
          deleteAction={boundDelete}
          showFeaturedToggle
        />

        <div className="flex items-baseline justify-between mb-6 mt-12">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Spa &amp; Wellness</h2>
            <p className="text-sm text-gray-500 mt-1">
              {spaOffers.length} offer{spaOffers.length !== 1 ? "s" : ""} · in-house spa, shown below Happenings on the hotel page
            </p>
          </div>
        </div>

        <HappeningsManager
          happenings={spaOffers}
          createAction={boundCreateSpa}
          updateActions={spaUpdateActions}
          deleteAction={boundDeleteSpa}
          visibleLabel="Visible on the hotel's public page, in the Spa & Wellness section"
          emptyStateBody="Add a flyer and a few lines about this hotel's in-house spa — treatments, packages, seasonal offers."
          showFeaturedToggle
        />
      </main>
    </div>
  );
}

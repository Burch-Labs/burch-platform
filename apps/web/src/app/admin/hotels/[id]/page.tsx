import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { HappeningsManager } from "./HappeningsManager";
import { createHappening, updateHappening, deleteHappening } from "./actions";

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

  const boundCreate = createHappening.bind(null, hotel.id);
  const updateActions = Object.fromEntries(
    happenings.map((h) => [h.id, updateHappening.bind(null, hotel.id, h.id)])
  );
  const boundDelete = deleteHappening.bind(null, hotel.id);

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
        />
      </main>
    </div>
  );
}

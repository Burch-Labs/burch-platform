import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { HappeningsManager } from "@/components/venues/HappeningsManager";
import { createOffer, updateOffer, deleteOffer } from "./actions";
import { isAdminRole } from "@/lib/roles";

export const dynamic = "force-dynamic";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function AdminClubOffersPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) redirect("/dashboard?error=unauthorized");

  const club = await prisma.club.findUnique({
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
    },
  });
  if (!club) notFound();

  const offers = club.happenings.map((h) => ({
    ...h,
    startsAt: h.startsAt ? h.startsAt.toISOString() : null,
    endsAt: h.endsAt ? h.endsAt.toISOString() : null,
  }));

  const boundCreate = createOffer.bind(null, club.id);
  const updateActions = Object.fromEntries(
    offers.map((o) => [o.id, updateOffer.bind(null, club.id, o.id)])
  );
  const boundDelete = deleteOffer.bind(null, club.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        {/* Breadcrumb */}
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link href="/admin/clubs" className="text-sm text-gray-500 hover:text-gray-700">
            ← All clubs
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900 truncate max-w-[240px]">{club.name}</h1>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Offers</h2>
            <p className="text-sm text-gray-500 mt-1">
              {offers.length} offer{offers.length !== 1 ? "s" : ""} · {club.name}
              {club.city ? ` · ${club.city}` : ""}
            </p>
          </div>
          <Link
            href={`/clubs/${club.id}#offers`}
            target="_blank"
            className="text-sm font-medium text-orange-600 hover:text-orange-700 transition"
          >
            View public page ↗
          </Link>
        </div>

        <HappeningsManager
          happenings={offers}
          createAction={boundCreate}
          updateActions={updateActions}
          deleteAction={boundDelete}
          visibleLabel="Visible on the club's public page"
          emptyStateBody="Add a flyer and a few lines about a current offer, promotion, or event at this club."
          showFeaturedToggle
        />
      </main>
    </div>
  );
}

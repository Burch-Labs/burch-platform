import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { HotelGallery } from "@/components/hotels/HotelGallery";
import { AmenityList } from "@/components/hotels/AmenityList";
import { AccessBadge, ACCESS_EXPLANATION } from "@/components/clubs/AccessBadge";
import { BookExternally } from "@/components/venues/BookExternally";
import { OffersList } from "@/components/venues/OffersList";
import { formatCurrency } from "@/lib/format";
import { formatVenueAddress } from "@/lib/utils";
import type { ClubCategory } from "@prisma/client";

const CATEGORY_ICON: Record<ClubCategory, string> = {
  GOLF: "⛳",
  COUNTRY: "⛳",
  SPORTS: "🏆",
  POLO: "🐎",
  YACHT: "⛵",
  SPA: "💆",
};

interface PageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    select: { name: true, description: true },
  });
  if (!club) return { title: "Club not found" };
  return { title: `${club.name} — dontbeboringKE`, description: club.description ?? undefined };
}

export default async function ClubDetailPage({ params }: PageProps) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id, published: true },
    include: {
      happenings: {
        where: { published: true },
        orderBy: [{ startsAt: "asc" }, { createdAt: "desc" }],
      },
    },
  });
  if (!club) notFound();

  const offers = club.happenings.map((h) => ({
    ...h,
    startsAt: h.startsAt ? h.startsAt.toISOString() : null,
    endsAt: h.endsAt ? h.endsAt.toISOString() : null,
  }));

  const images = [
    ...(club.imageUrl ? [club.imageUrl] : []),
    ...club.images.filter((img) => img !== club.imageUrl),
  ];
  const fee = club.visitorFee === null ? null : Number(club.visitorFee);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/clubs" className="hover:text-orange-600 transition">Golf &amp; clubs</Link>
          <span>/</span>
          <span className="text-gray-600 truncate">{club.name}</span>
        </div>

        {images.length > 0 ? (
          <div className="mb-8">
            <HotelGallery images={images} name={club.name} />
          </div>
        ) : (
          <div className="mb-8 h-64 rounded-2xl bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
            <span className="text-8xl opacity-30">{CATEGORY_ICON[club.category]}</span>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 min-w-0 space-y-8">
            <div>
              <div className="mb-2">
                <AccessBadge access={club.access} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 mb-1">{club.name}</h1>
              <p className="text-gray-500">{formatVenueAddress(club.location, club.city)}</p>
            </div>

            {/* Access comes first — everything below only matters if you can play. */}
            <div className="bg-surface rounded-2xl border border-gray-100 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Can you play here?</h2>
              <p className="text-sm text-gray-600 leading-relaxed">
                {ACCESS_EXPLANATION[club.access]}
              </p>
              {club.visitorNotes && (
                <p className="text-sm text-gray-600 leading-relaxed mt-3 pt-3 border-t border-gray-100">
                  {club.visitorNotes}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                ...(club.holes !== null ? [{ label: "Holes", value: String(club.holes) }] : []),
                ...(club.par !== null ? [{ label: "Par", value: String(club.par) }] : []),
                {
                  label: "Visitor green fee",
                  value: fee !== null ? formatCurrency(fee, club.currency) : "On request",
                },
                { label: "Phone", value: club.phone ?? "—" },
              ].map(({ label, value }) => (
                <div key={label} className="bg-surface rounded-xl border border-gray-100 p-3">
                  <p className="text-xs text-gray-400 mb-0.5">{label}</p>
                  <p className="text-sm font-semibold text-gray-900 truncate">{value}</p>
                </div>
              ))}
            </div>

            {offers.length > 0 && (
              <div
                id="offers"
                className="scroll-mt-24 bg-gradient-to-br from-orange-50/70 to-white rounded-2xl border border-orange-100 p-6"
              >
                <div className="flex items-center gap-2 mb-4">
                  <span aria-hidden>✨</span>
                  <h2 className="text-lg font-semibold text-gray-900">Offers</h2>
                </div>
                <OffersList offers={offers} kind="clubHappening" />
              </div>
            )}

            {club.description && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-3">About</h2>
                <p className="text-sm text-gray-600 leading-relaxed">{club.description}</p>
              </div>
            )}

            {club.amenities.length > 0 && (
              <div className="bg-surface rounded-2xl border border-gray-100 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Facilities</h2>
                <AmenityList amenities={club.amenities} />
              </div>
            )}
          </div>

          <div className="lg:w-80 flex-shrink-0">
            <div className="sticky top-20">
              {/* Same outbound model as hotels and restaurants: we do not hold
                  tee times, so we do not pretend to book one. */}
              <BookExternally
                website={club.website}
                venueName={club.name}
                phone={club.phone}
                email={club.email}
                verified={club.verified}
                venueType="club"
                venueId={club.id}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

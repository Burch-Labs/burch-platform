import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { ClaimForm } from "./ClaimForm";
import type { VenueType } from "./actions";

const TYPES = ["hotel", "restaurant", "club"] as const;

export const metadata = { title: "Claim a listing — dontbeboring" };

export default async function ClaimPage({
  params,
}: {
  params: Promise<{ type: string; id: string }>;
}) {
  const { type, id } = await params;
  if (!TYPES.includes(type as VenueType)) notFound();
  const venueType = type as VenueType;

  const venue =
    venueType === "hotel"
      ? await prisma.hotel.findUnique({ where: { id }, select: { name: true, city: true, location: true } })
      : venueType === "restaurant"
        ? await prisma.restaurant.findUnique({ where: { id }, select: { name: true, city: true, location: true } })
        : await prisma.club.findUnique({ where: { id }, select: { name: true, city: true, location: true } });

  if (!venue) notFound();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-xl mx-auto px-6 py-10">
        <Link href={`/${venueType}s/${id}`} className="text-sm text-gray-400 hover:text-orange-600 transition">
          ← Back to the listing
        </Link>

        <h1 className="text-2xl font-bold text-gray-900 mt-4 mb-1">Claim {venue.name}</h1>
        <p className="text-sm text-gray-500 mb-6">
          {venue.location}
          {venue.city && !venue.location.includes(venue.city) ? `, ${venue.city}` : ""}
        </p>

        <div className="rounded-xl border border-gray-200 bg-white px-5 py-4 mb-6">
          <p className="text-sm text-gray-600 leading-relaxed">
            We put this listing together from public information. If you work here, claiming it
            lets you correct the details, add your booking link, and take enquiries directly.
            It costs nothing.
          </p>
        </div>

        <ClaimForm type={venueType} id={id} />
      </main>
    </div>
  );
}

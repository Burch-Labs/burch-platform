import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { ClubCard } from "@/components/clubs/ClubCard";
import { SearchBar } from "@/components/events/SearchBar";
import { Suspense } from "react";

export const metadata = {
  title: "Golf & clubs — dontbeboringKE",
  description: "Golf courses, country clubs and sports clubs across Kenya.",
};

export const revalidate = 300;

interface PageProps {
  searchParams: Promise<{ q?: string; city?: string }>;
}

export default async function ClubsPage({ searchParams }: PageProps) {
  const sp = await searchParams;
  const q = sp.q?.trim() ?? "";
  const city = sp.city?.trim() ?? "";

  const clubs = await prisma.club.findMany({
    where: {
      published: true,
      ...(city && { city: { equals: city, mode: "insensitive" } }),
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { location: { contains: q, mode: "insensitive" } },
          { city: { contains: q, mode: "insensitive" } },
          { description: { contains: q, mode: "insensitive" } },
        ],
      }),
    },
    orderBy: [{ city: "asc" }, { name: "asc" }],
    select: {
      id: true, name: true, city: true, location: true,
      category: true, access: true, holes: true, par: true,
      visitorFee: true, currency: true, imageUrl: true, amenities: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />

      <section className="bg-surface border-b border-gray-200">
        <div className="max-w-6xl mx-auto px-6 pt-10 pb-8">
          <h1 className="font-display text-4xl font-bold text-gray-900 mb-1">Golf &amp; clubs</h1>
          <p className="text-gray-500 mb-6">
            Courses and country clubs across Kenya, with what a visitor can actually expect
          </p>
          <Suspense>
            <SearchBar />
          </Suspense>
        </div>
      </section>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <p className="text-sm text-gray-500 mb-4">
          {clubs.length === 0
            ? "No clubs found"
            : `${clubs.length} club${clubs.length !== 1 ? "s" : ""}`}
        </p>

        {clubs.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-gray-100 p-12 text-center">
            <div className="text-4xl mb-3">⛳</div>
            <p className="text-gray-600 font-medium mb-1">Nothing matches that search</p>
            <p className="text-sm text-gray-400">Try a different town or clear the search.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {clubs.map((club, i) => (
              <ClubCard key={club.id} club={club} priority={i < 3} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

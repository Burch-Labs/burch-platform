import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";

export const metadata = { title: "Hotels — dontbeboring" };
export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const [hotels, counts] = await Promise.all([
    prisma.hotel.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        city: true,
        _count: { select: { happenings: true } },
      },
    }),
    getQueueCounts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Hotels</h1>
        <p className="text-sm text-gray-500 mb-6">
          Add flyers and text for what's on at each hotel's restaurant — brunch, live music,
          seasonal specials. Rooms and rates aren't managed here.
        </p>

        <AdminNav active="/admin/hotels" counts={counts} />

        {hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-500">No hotels yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-100 divide-y divide-gray-100">
            {hotels.map((hotel) => (
              <Link
                key={hotel.id}
                href={`/admin/hotels/${hotel.id}`}
                className="flex items-center justify-between gap-4 px-6 py-4 hover:bg-orange-50/60 transition"
              >
                <div className="min-w-0">
                  <p className="font-medium text-gray-900 truncate">{hotel.name}</p>
                  {hotel.city && <p className="text-sm text-gray-400">{hotel.city}</p>}
                </div>
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                    hotel._count.happenings > 0
                      ? "bg-orange-50 text-orange-700 border border-orange-200"
                      : "bg-gray-50 text-gray-500 border border-gray-200"
                  }`}
                >
                  {hotel._count.happenings > 0
                    ? `${hotel._count.happenings} happening${hotel._count.happenings !== 1 ? "s" : ""}`
                    : "None yet"}
                </span>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";
import { isAdminRole } from "@/lib/roles";

export const metadata = { title: "Hotels — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function AdminHotelsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) redirect("/dashboard?error=unauthorized");

  const [hotels, counts] = await Promise.all([
    prisma.hotel.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        partner: { select: { name: true } },
        _count: { select: { bookings: true, rooms: true } },
      },
    }),
    getQueueCounts(),
  ]);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Hotels</h1>
        <p className="text-sm text-gray-500 mb-6">
          Every hotel listed on the platform. Admins can edit any hotel's info and photos,
          regardless of which partner owns it — useful for correcting or filling in real venue
          details.
        </p>

        <AdminNav active="/admin/hotels" counts={counts} />

        {hotels.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
            <p className="text-sm text-gray-500">No hotels yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {hotels.map((hotel) => (
              <div
                key={hotel.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{hotel.name}</p>
                    <span
                      className={`shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                        hotel.published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {hotel.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {hotel.partner.name}
                    {" · "}
                    {hotel.city}
                    {hotel.starRating ? ` · ${hotel.starRating}★` : ""}
                    {" · "}
                    {hotel._count.rooms} room{hotel._count.rooms !== 1 ? "s" : ""}
                    {" · "}
                    {hotel._count.bookings} booking{hotel._count.bookings !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/admin/hotels/${hotel.id}/import`}
                    className="text-sm text-gray-500 hover:text-gray-700 font-medium px-3 py-1.5 rounded-lg hover:bg-gray-50 transition"
                  >
                    Import JSON
                  </Link>
                  <Link
                    href={`/partner/hotels/${hotel.id}/edit`}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                  >
                    Edit
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

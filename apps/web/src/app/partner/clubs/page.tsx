import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { DeleteClubButton } from "./DeleteClubButton";
import { isAdminRole } from "@/lib/roles";

const CATEGORY_LABEL: Record<string, string> = {
  GOLF: "Golf course",
  COUNTRY: "Country club",
  SPORTS: "Sports club",
  POLO: "Polo club",
  YACHT: "Yacht club",
  SPA: "Spa & Wellness",
};

export default async function PartnerClubsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  const clubs = await prisma.club.findMany({
    where: { partnerId: partner.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      category: true,
      published: true,
    },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Clubs</h1>
            <p className="text-sm text-gray-500 mt-1">
              {clubs.length} club{clubs.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
              ← Partner Portal
            </Link>
            <Link
              href="/partner/clubs/new"
              className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              + New club
            </Link>
          </div>
        </div>

        {clubs.length === 0 ? (
          <div className="bg-surface rounded-2xl border border-dashed border-gray-200 px-8 py-14 text-center">
            <p className="text-4xl mb-4">⛳</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">No clubs yet</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
              List a golf course, country club, or sports club and it will appear on the
              Golf &amp; Clubs page immediately after publishing.
            </p>
            <Link
              href="/partner/clubs/new"
              className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Add club
            </Link>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
            {clubs.map((club) => (
              <div
                key={club.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900 truncate">{club.name}</p>
                    <span
                      className={`shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full border ${
                        club.published
                          ? "bg-green-50 text-green-700 border-green-200"
                          : "bg-gray-50 text-gray-500 border-gray-200"
                      }`}
                    >
                      {club.published ? "Published" : "Draft"}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">
                    {club.city} · {CATEGORY_LABEL[club.category] ?? club.category}
                  </p>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/partner/clubs/${club.id}/edit`}
                    className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                  >
                    Edit
                  </Link>
                  <DeleteClubButton clubId={club.id} clubName={club.name} />
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

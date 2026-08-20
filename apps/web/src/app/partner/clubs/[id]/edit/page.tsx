import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { ClubForm } from "../../ClubForm";
import { updateClub } from "../../actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditClubPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const isAdmin = isAdminRole(session.user.role);

  // An admin can curate any club regardless of who owns it — no partner
  // profile of their own required. A plain partner stays scoped to clubs
  // they actually own. Mirrors EditHotelPage's same isAdmin branch.
  let club;
  if (isAdmin) {
    club = await prisma.club.findUnique({ where: { id } });
  } else {
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!partner) redirect("/partner/onboarding");
    club = await prisma.club.findFirst({ where: { id, partnerId: partner.id } });
  }
  if (!club) notFound();

  const boundUpdate = updateClub.bind(null, club.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={isAdmin ? "/admin/clubs" : "/partner/clubs"}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {isAdmin ? "All clubs" : "My clubs"}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{club.name}</h1>
        </div>

        {/* Manage offers shortcut — admin manages offers from /admin/clubs/[id] instead,
            since that route isn't gated on owning a partner profile. */}
        {!isAdmin && (
          <div className="mb-6 flex items-center justify-between bg-surface rounded-2xl border border-gray-200 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Offers</p>
              <p className="text-xs text-gray-500 mt-0.5">Add up to 10 flyers for current offers, promotions, or events</p>
            </div>
            <Link
              href={`/partner/clubs/${club.id}/offers`}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-xl hover:bg-orange-50 transition"
            >
              Manage offers →
            </Link>
          </div>
        )}

        <div className="bg-surface rounded-2xl border border-gray-200 p-8">
          <ClubForm
            action={boundUpdate}
            submitLabel="Save changes"
            defaults={{
              name:         club.name,
              description:  club.description ?? "",
              imageUrl:     club.imageUrl ?? "",
              city:         club.city,
              location:     club.location,
              category:     club.category,
              access:       club.access,
              holes:        club.holes != null ? String(club.holes) : "",
              par:          club.par != null ? String(club.par) : "",
              visitorFee:   club.visitorFee != null ? String(club.visitorFee) : "",
              currency:     club.currency,
              visitorNotes: club.visitorNotes ?? "",
              phone:        club.phone ?? "",
              email:        club.email ?? "",
              website:      club.website ?? "",
              amenities:    club.amenities.join(", "),
              published:    club.published,
            }}
          />
        </div>
      </main>
    </div>
  );
}

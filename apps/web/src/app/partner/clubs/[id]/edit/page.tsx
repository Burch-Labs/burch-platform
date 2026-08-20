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

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  const club = await prisma.club.findFirst({
    where: { id, partnerId: partner.id },
  });
  if (!club) notFound();

  const boundUpdate = updateClub.bind(null, club.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/partner/clubs" className="text-sm text-gray-500 hover:text-gray-700">
            ← My clubs
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{club.name}</h1>
        </div>

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

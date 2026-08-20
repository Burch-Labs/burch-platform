import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { HappeningsManager } from "@/components/venues/HappeningsManager";
import { createHappening, updateHappening, deleteHappening } from "./actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageHappeningsPage({ params }: Props) {
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

  const hotel = await prisma.hotel.findFirst({
    where: { id, partnerId: partner.id },
    select: {
      id: true,
      name: true,
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
          <Link href="/partner/hotels" className="text-sm text-gray-500 hover:text-gray-700">
            ← My hotels
          </Link>
          <span className="text-gray-300">/</span>
          <Link
            href={`/partner/hotels/${hotel.id}/edit`}
            className="text-sm text-gray-500 hover:text-gray-700 truncate max-w-[160px]"
          >
            {hotel.name}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">Manage happenings</h1>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Happenings</h2>
            <p className="text-sm text-gray-500 mt-1">
              {happenings.length}/10 happening{happenings.length !== 1 ? "s" : ""} · {hotel.name}
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

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { HotelForm } from "../../HotelForm";
import { updateHotel } from "../../actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHotelPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const isAdmin = isAdminRole(session.user.role);

  // An admin can curate any hotel's info regardless of who owns it — no
  // partner profile of their own required. A plain partner is still scoped
  // to hotels they actually own.
  let hotel;
  if (isAdmin) {
    hotel = await prisma.hotel.findUnique({ where: { id } });
  } else {
    const partner = await prisma.partner.findUnique({
      where: { userId: session.user.id },
      select: { id: true },
    });
    if (!partner) redirect("/partner/onboarding");
    hotel = await prisma.hotel.findFirst({ where: { id, partnerId: partner.id } });
  }
  if (!hotel) notFound();

  // Bind the hotelId into the action so the form only needs prev+data
  const boundUpdate = updateHotel.bind(null, hotel.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link
            href={isAdmin ? "/admin/hotels" : "/partner/hotels"}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← {isAdmin ? "All hotels" : "My hotels"}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{hotel.name}</h1>
        </div>

        {/* Manage happenings shortcut */}
        {!isAdmin && (
          <div className="mb-6 flex items-center justify-between bg-surface rounded-2xl border border-gray-200 px-6 py-4">
            <div>
              <p className="text-sm font-semibold text-gray-900">Happenings</p>
              <p className="text-xs text-gray-500 mt-0.5">
                Add up to 10 flyers for what's on at your restaurant — brunch, live music, seasonal specials
              </p>
            </div>
            <Link
              href={`/partner/hotels/${hotel.id}/happenings`}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-xl hover:bg-orange-50 transition"
            >
              Manage happenings →
            </Link>
          </div>
        )}

        {/* Manage rooms shortcut */}
        <div className="mb-6 flex items-center justify-between bg-surface rounded-2xl border border-gray-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Rooms</p>
            <p className="text-xs text-gray-500 mt-0.5">Add, edit, or remove room types and pricing</p>
          </div>
          <Link
            href={`/partner/hotels/${hotel.id}/rooms`}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-xl hover:bg-orange-50 transition"
          >
            Manage rooms →
          </Link>
        </div>

        <div className="bg-surface rounded-2xl border border-gray-200 p-8">
          <HotelForm
            action={boundUpdate}
            submitLabel="Save changes"
            defaults={{
              name:         hotel.name,
              description:  hotel.description ?? "",
              imageUrl:     hotel.imageUrl ?? "",
              images:       hotel.images,
              city:         hotel.city,
              location:     hotel.location,
              starRating:   hotel.starRating != null ? String(hotel.starRating) : "",
              amenities:    hotel.amenities.join(", "),
              phone:        hotel.phone ?? "",
              email:        hotel.email ?? "",
              website:      hotel.website ?? "",
              checkInTime:  hotel.checkInTime,
              checkOutTime: hotel.checkOutTime,
              published:    hotel.published,
            }}
          />
        </div>
      </main>
    </div>
  );
}

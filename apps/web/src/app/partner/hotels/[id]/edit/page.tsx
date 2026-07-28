import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { HotelForm } from "../../HotelForm";
import { updateHotel } from "../../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditHotelPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  const hotel = await prisma.hotel.findFirst({
    where: { id, partnerId: partner.id },
  });
  if (!hotel) notFound();

  // Bind the hotelId into the action so the form only needs prev+data
  const boundUpdate = updateHotel.bind(null, hotel.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/partner/hotels" className="text-sm text-gray-500 hover:text-gray-700">
            ← My hotels
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{hotel.name}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <HotelForm
            action={boundUpdate}
            submitLabel="Save changes"
            defaults={{
              name:         hotel.name,
              description:  hotel.description ?? "",
              imageUrl:     hotel.imageUrl ?? "",
              city:         hotel.city,
              location:     hotel.location,
              starRating:   hotel.starRating != null ? String(hotel.starRating) : "",
              amenities:    hotel.amenities.join(", "),
              phone:        hotel.phone ?? "",
              email:        hotel.email ?? "",
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

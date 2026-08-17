import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { RoomsManager } from "./RoomsManager";
import { createRoom, updateRoom, deleteRoom } from "./actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageRoomsPage({ params }: Props) {
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
      rooms: {
        orderBy: { createdAt: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          imageUrl: true,
          price: true,
          currency: true,
          capacity: true,
          maxGuests: true,
          bedType: true,
          amenities: true,
          quantity: true,
          available: true,
        },
      },
    },
  });
  if (!hotel) notFound();

  // Serialize Prisma Decimal → number to cross the RSC → client boundary
  const rooms = hotel.rooms.map((r) => ({
    ...r,
    price: Number(r.price),
  }));

  // Bind hotel-scoped actions
  const boundCreate = createRoom.bind(null, hotel.id);

  // Factory so RoomsManager can build a bound update action per room id
  // We pass the factory as a server action by creating a per-room bound version
  // on the server and passing them as a lookup map.
  const updateActions = Object.fromEntries(
    rooms.map((r) => [r.id, updateRoom.bind(null, hotel.id, r.id)])
  );

  const boundDelete = deleteRoom.bind(null, hotel.id);

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
          <h1 className="text-sm font-semibold text-gray-900">Manage rooms</h1>
        </div>

        <div className="flex items-baseline justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Rooms</h2>
            <p className="text-sm text-gray-500 mt-1">
              {rooms.length} room type{rooms.length !== 1 ? "s" : ""} · {hotel.name}
            </p>
          </div>
        </div>

        <RoomsManager
          rooms={rooms}
          createAction={boundCreate}
          updateActions={updateActions}
          deleteAction={boundDelete}
        />
      </main>
    </div>
  );
}

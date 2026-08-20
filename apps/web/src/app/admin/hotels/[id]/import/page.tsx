import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { isAdminRole } from "@/lib/roles";
import { importHotelJson } from "@/app/partner/hotels/actions";
import { ImportJsonForm } from "./ImportJsonForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ImportHotelJsonPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) redirect("/dashboard?error=unauthorized");

  const hotel = await prisma.hotel.findUnique({ where: { id } });
  if (!hotel) notFound();

  const defaultJson = JSON.stringify(
    {
      name: hotel.name,
      description: hotel.description,
      imageUrl: hotel.imageUrl,
      images: hotel.images,
      city: hotel.city,
      location: hotel.location,
      starRating: hotel.starRating,
      amenities: hotel.amenities,
      phone: hotel.phone,
      email: hotel.email,
      website: hotel.website,
      checkInTime: hotel.checkInTime,
      checkOutTime: hotel.checkOutTime,
      published: hotel.published,
    },
    null,
    2,
  );

  const boundImport = importHotelJson.bind(null, hotel.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-2">
          <Link href="/admin/hotels" className="text-sm text-gray-500 hover:text-gray-700">
            ← All hotels
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{hotel.name}</h1>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Edit any subset of these fields and save — omitted keys are left untouched. Image URLs
          can point directly at a source's own hosting; nothing needs to be uploaded first.
        </p>

        <div className="bg-surface rounded-2xl border border-gray-200 p-8">
          <ImportJsonForm action={boundImport} defaultJson={defaultJson} />
        </div>
      </main>
    </div>
  );
}

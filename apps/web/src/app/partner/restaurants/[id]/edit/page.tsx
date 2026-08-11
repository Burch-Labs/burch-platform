import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { RestaurantForm } from "../../RestaurantForm";
import { updateRestaurant } from "../../actions";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditRestaurantPage({ params }: Props) {
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

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, partnerId: partner.id },
  });
  if (!restaurant) notFound();

  // Bind the restaurantId into the action so the form only needs prev+data
  const boundUpdate = updateRestaurant.bind(null, restaurant.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/partner/restaurants" className="text-sm text-gray-500 hover:text-gray-700">
            ← My restaurants
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <RestaurantForm
            action={boundUpdate}
            submitLabel="Save changes"
            defaults={{
              name:        restaurant.name,
              description: restaurant.description ?? "",
              imageUrl:    restaurant.imageUrl ?? "",
              city:        restaurant.city,
              location:    restaurant.location,
              cuisine:     restaurant.cuisine ?? "",
              priceRange:  restaurant.priceRange != null ? String(restaurant.priceRange) : "",
              phone:       restaurant.phone ?? "",
              email:       restaurant.email ?? "",
              website:     restaurant.website ?? "",
              amenities:   restaurant.amenities.join(", "),
              published:   restaurant.published,
            }}
          />
        </div>
      </main>
    </div>
  );
}

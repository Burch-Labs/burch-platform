import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { MenuManager } from "./MenuManager";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageMenuPage({ params }: Props) {
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

  const restaurant = await prisma.restaurant.findFirst({
    where: { id, partnerId: partner.id },
    select: {
      id: true,
      name: true,
      published: true,
      menuItems: {
        orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
      },
    },
  });
  if (!restaurant) notFound();

  // Serialize Decimal price for the client component
  const items = restaurant.menuItems.map((item) => ({
    id: item.id,
    name: item.name,
    description: item.description,
    price: item.price.toString(),
    currency: item.currency,
    category: item.category,
    imageUrl: item.imageUrl,
    available: item.available,
    sortOrder: item.sortOrder,
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-3">
              <Link href="/partner/restaurants" className="text-sm text-gray-500 hover:text-gray-700">
                ← My restaurants
              </Link>
              <span className="text-gray-300">/</span>
              <h1 className="text-2xl font-bold text-gray-900 truncate">{restaurant.name}</h1>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Menu · {items.length} item{items.length !== 1 ? "s" : ""}
              {!restaurant.published && " · Draft listing"}
            </p>
          </div>
          {restaurant.published && (
            <Link
              href={`/restaurants/${restaurant.id}`}
              className="text-sm text-orange-600 hover:text-orange-700 font-medium shrink-0"
            >
              View public page →
            </Link>
          )}
        </div>

        <MenuManager restaurantId={restaurant.id} items={items} />
      </main>
    </div>
  );
}

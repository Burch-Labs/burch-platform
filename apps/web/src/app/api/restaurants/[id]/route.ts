import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const restaurant = await prisma.restaurant.findUnique({
      where: { id, published: true },
      include: {
        partner: {
          include: { user: { select: { id: true, name: true, image: true } } },
        },
        menuItems: {
          where: { available: true },
          orderBy: [{ category: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
        },
        reviews: {
          include: { user: { select: { id: true, name: true, image: true } } },
          orderBy: { createdAt: "desc" },
          take: 30,
        },
        _count: { select: { reviews: true, reservations: true } },
      },
    });

    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const ratings = restaurant.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratings.filter((r) => r === star).length,
    }));

    return NextResponse.json({ restaurant: { ...restaurant, avgRating }, distribution });
  } catch (err) {
    console.error("[GET /api/restaurants/[id]]", err);
    return NextResponse.json({ error: "Failed to load restaurant." }, { status: 500 });
  }
}

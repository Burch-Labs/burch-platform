import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const hotel = await prisma.hotel.findUnique({
      where: { id, published: true },
      include: {
        partner: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        rooms: {
          where: { available: true },
          orderBy: { price: "asc" },
        },
        reviews: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
          orderBy: { createdAt: "desc" },
          take: 20,
        },
        _count: { select: { bookings: true, reviews: true } },
      },
    });

    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    const ratings = hotel.reviews.map((r) => r.rating);
    const avgRating =
      ratings.length > 0
        ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
        : null;

    // Rating distribution
    const distribution = [5, 4, 3, 2, 1].map((star) => ({
      star,
      count: ratings.filter((r) => r === star).length,
    }));

    return NextResponse.json({ hotel: { ...hotel, avgRating }, distribution });
  } catch (err) {
    console.error("[GET /api/hotels/[id]]", err);
    return NextResponse.json({ error: "Failed to load hotel." }, { status: 500 });
  }
}

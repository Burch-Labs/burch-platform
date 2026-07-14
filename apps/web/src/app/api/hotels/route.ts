import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    const stars = searchParams.get("stars") ? Number(searchParams.get("stars")) : null;
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const where = {
      published: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(city && { city: { contains: city, mode: "insensitive" as const } }),
      ...(stars && { starRating: stars }),
    };

    const [hotels, total, cityRows] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: {
          partner: { select: { id: true, name: true } },
          rooms: { select: { price: true, currency: true }, orderBy: { price: "asc" } },
          _count: { select: { rooms: true, reviews: true, bookings: true } },
          reviews: { select: { rating: true } },
        },
        orderBy: { name: "asc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where: { published: true },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
    ]);

    // Compute avgRating for each hotel
    const hotelsWithRating = hotels.map((h) => {
      const ratings = h.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
      const { reviews: _reviews, ...rest } = h;
      return { ...rest, avgRating };
    });

    return NextResponse.json({
      hotels: hotelsWithRating,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      cities: cityRows.map((r) => r.city).filter(Boolean),
    });
  } catch (err) {
    console.error("[GET /api/hotels]", err);
    return NextResponse.json({ error: "Failed to load hotels." }, { status: 500 });
  }
}

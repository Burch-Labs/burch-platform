import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q         = searchParams.get("q")?.trim() ?? "";
    const city      = searchParams.get("city")?.trim() ?? "";
    const stars     = searchParams.get("stars") ? Number(searchParams.get("stars")) : null;
    const amenities = searchParams.get("amenities")?.split(",").filter(Boolean) ?? [];
    const sort      = searchParams.get("sort") ?? "name";
    const page      = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const orderBy =
      sort === "stars_desc"
        ? [{ starRating: "desc" as const }, { name: "asc" as const }]
        : sort === "stars_asc"
        ? [{ starRating: "asc" as const }, { name: "asc" as const }]
        : sort === "newest"
        ? { createdAt: "desc" as const }
        : { name: "asc" as const };

    const where = {
      published: true,
      ...(q && {
        OR: [
          { name:        { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location:    { contains: q, mode: "insensitive" as const } },
          { city:        { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(city      && { city:       { contains: city, mode: "insensitive" as const } }),
      ...(stars     && { starRating: stars }),
      ...(amenities.length > 0 && { amenities: { hasEvery: amenities } }),
    };

    const [hotels, total, cityRows] = await Promise.all([
      prisma.hotel.findMany({
        where,
        include: {
          partner: { select: { id: true, name: true } },
          rooms:   { select: { price: true, currency: true }, orderBy: { price: "asc" } },
          _count:  { select: { rooms: true, reviews: true, bookings: true } },
          reviews: { select: { rating: true } },
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        orderBy: orderBy as any,
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.hotel.count({ where }),
      prisma.hotel.findMany({
        where:    { published: true },
        select:   { city: true },
        distinct: ["city"],
        orderBy:  { city: "asc" },
      }),
    ]);

    const hotelsWithRating = hotels.map((h) => {
      const ratings   = h.reviews.map((r) => r.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
      const { reviews: _r, ...rest } = h;
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

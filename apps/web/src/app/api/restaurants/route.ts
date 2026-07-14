import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const city = searchParams.get("city")?.trim() ?? "";
    const cuisine = searchParams.get("cuisine")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const where = {
      published: true,
      ...(q && {
        OR: [
          { name: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { cuisine: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(city && { city: { contains: city, mode: "insensitive" as const } }),
      ...(cuisine && { cuisine: { contains: cuisine, mode: "insensitive" as const } }),
    };

    const [restaurants, total, cityRows, cuisineRows] = await Promise.all([
      prisma.restaurant.findMany({
        where,
        include: {
          partner: { select: { id: true, name: true } },
          reviews: { select: { rating: true } },
          _count: { select: { reviews: true, menuItems: true } },
        },
        orderBy: { name: "asc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.restaurant.count({ where }),
      prisma.restaurant.findMany({
        where: { published: true },
        select: { city: true },
        distinct: ["city"],
        orderBy: { city: "asc" },
      }),
      prisma.restaurant.findMany({
        where: { published: true, cuisine: { not: null } },
        select: { cuisine: true },
        distinct: ["cuisine"],
        orderBy: { cuisine: "asc" },
      }),
    ]);

    const withRating = restaurants.map((r) => {
      const ratings = r.reviews.map((rv) => rv.rating);
      const avgRating =
        ratings.length > 0
          ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10
          : null;
      const { reviews: _, ...rest } = r;
      return { ...rest, avgRating };
    });

    return NextResponse.json({
      restaurants: withRating,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      cities: cityRows.map((r) => r.city).filter(Boolean),
      cuisines: cuisineRows.map((r) => r.cuisine).filter(Boolean),
    });
  } catch (err) {
    console.error("[GET /api/restaurants]", err);
    return NextResponse.json({ error: "Failed to load restaurants." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { EventCategory } from "@prisma/client";

const PAGE_SIZE = 12;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const q = searchParams.get("q")?.trim() ?? "";
    const category = searchParams.get("category") as EventCategory | null;
    const city = searchParams.get("city")?.trim() ?? "";
    const page = Math.max(1, Number(searchParams.get("page") ?? "1"));

    const where = {
      published: true,
      startDate: { gte: new Date() },
      ...(q && {
        OR: [
          { title: { contains: q, mode: "insensitive" as const } },
          { description: { contains: q, mode: "insensitive" as const } },
          { location: { contains: q, mode: "insensitive" as const } },
          { city: { contains: q, mode: "insensitive" as const } },
        ],
      }),
      ...(category && { category }),
      ...(city && { city: { contains: city, mode: "insensitive" as const } }),
    };

    const [events, total] = await Promise.all([
      prisma.event.findMany({
        where,
        include: {
          partner: {
            select: {
              id: true,
              name: true,
              logoUrl: true,
              user: { select: { id: true, name: true, image: true } },
            },
          },
          _count: { select: { bookings: true } },
        },
        orderBy: { startDate: "asc" },
        take: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
      }),
      prisma.event.count({ where }),
    ]);

    // Get distinct cities for the filter
    const cityRows = await prisma.event.findMany({
      where: { published: true },
      select: { city: true },
      distinct: ["city"],
      orderBy: { city: "asc" },
    });

    return NextResponse.json({
      events,
      total,
      page,
      pageSize: PAGE_SIZE,
      totalPages: Math.ceil(total / PAGE_SIZE),
      cities: cityRows.map((r) => r.city).filter(Boolean),
    });
  } catch (err) {
    console.error("[GET /api/events]", err);
    return NextResponse.json({ error: "Failed to load events." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const event = await prisma.event.findUnique({
      where: { id },
      include: {
        partner: {
          include: {
            user: { select: { id: true, name: true, image: true } },
            _count: { select: { events: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
    });

    if (!event || !event.published) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Related events — same category, excluding this one
    const related = await prisma.event.findMany({
      where: {
        published: true,
        category: event.category,
        id: { not: event.id },
        startDate: { gte: new Date() },
      },
      include: {
        partner: {
          select: {
            id: true,
            name: true,
            user: { select: { id: true, name: true, image: true } },
          },
        },
        _count: { select: { bookings: true } },
      },
      orderBy: { startDate: "asc" },
      take: 3,
    });

    return NextResponse.json({ event, related });
  } catch (err) {
    console.error("[GET /api/events/[id]]", err);
    return NextResponse.json({ error: "Failed to load event." }, { status: 500 });
  }
}

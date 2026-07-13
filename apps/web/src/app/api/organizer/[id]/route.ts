import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const organizer = await prisma.partner.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, image: true } },
        events: {
          where: { published: true, startDate: { gte: new Date() } },
          include: { _count: { select: { bookings: true } } },
          orderBy: { startDate: "asc" },
        },
        _count: { select: { events: true } },
      },
    });

    if (!organizer) {
      return NextResponse.json({ error: "Organizer not found." }, { status: 404 });
    }

    return NextResponse.json({ organizer });
  } catch (err) {
    console.error("[GET /api/organizer/[id]]", err);
    return NextResponse.json({ error: "Failed to load organizer." }, { status: 500 });
  }
}

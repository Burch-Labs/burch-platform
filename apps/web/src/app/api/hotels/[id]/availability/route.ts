import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = req.nextUrl;
    const checkIn = searchParams.get("checkIn");
    const checkOut = searchParams.get("checkOut");

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: "checkIn and checkOut are required." }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: "checkOut must be after checkIn." }, { status: 400 });
    }

    const rooms = await prisma.room.findMany({
      where: { hotelId: id, available: true },
      orderBy: { price: "asc" },
    });

    // For each room, count overlapping confirmed bookings
    const availability = await Promise.all(
      rooms.map(async (room) => {
        const overlapping = await prisma.booking.count({
          where: {
            roomId: room.id,
            status: { in: ["CONFIRMED", "PENDING"] },
            checkIn: { lt: checkOutDate },
            checkOut: { gt: checkInDate },
          },
        });
        const availableCount = Math.max(0, room.quantity - overlapping);
        return { ...room, availableCount, isAvailable: availableCount > 0 };
      })
    );

    return NextResponse.json({ rooms: availability });
  } catch (err) {
    console.error("[GET /api/hotels/[id]/availability]", err);
    return NextResponse.json({ error: "Failed to check availability." }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  roomId: z.string().min(1),
  checkIn: z.string().min(1),
  checkOut: z.string().min(1),
  guests: z.number().int().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Sign in to make a booking." }, { status: 401 });
    }

    const { id } = await params;
    const body = schema.parse(await req.json());
    const checkInDate = new Date(body.checkIn);
    const checkOutDate = new Date(body.checkOut);

    if (checkOutDate <= checkInDate) {
      return NextResponse.json({ error: "Check-out must be after check-in." }, { status: 400 });
    }

    // Verify hotel exists
    const hotel = await prisma.hotel.findUnique({
      where: { id, published: true },
      select: { id: true, name: true },
    });
    if (!hotel) {
      return NextResponse.json({ error: "Hotel not found." }, { status: 404 });
    }

    // Verify room belongs to hotel
    const room = await prisma.room.findFirst({
      where: { id: body.roomId, hotelId: id, available: true },
    });
    if (!room) {
      return NextResponse.json({ error: "Room not found." }, { status: 404 });
    }

    // Check capacity
    const overlapping = await prisma.booking.count({
      where: {
        roomId: body.roomId,
        status: { in: ["CONFIRMED", "PENDING"] },
        checkIn: { lt: checkOutDate },
        checkOut: { gt: checkInDate },
      },
    });
    if (overlapping >= room.quantity) {
      return NextResponse.json(
        { error: "This room is no longer available for the selected dates." },
        { status: 409 }
      );
    }

    // Calculate total
    const nights = Math.ceil(
      (checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 60 * 60 * 24)
    );
    const totalAmount = Number(room.price) * nights;

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        type: "HOTEL",
        status: "CONFIRMED",
        quantity: 1,
        totalAmount,
        currency: room.currency,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        hotelId: id,
        roomId: body.roomId,
        notes: `${body.guests} guest${body.guests > 1 ? "s" : ""}`,
      },
      include: { room: true, hotel: true },
    });

    return NextResponse.json({ booking, nights }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/hotels/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

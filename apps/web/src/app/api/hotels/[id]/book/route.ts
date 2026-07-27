import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPartnerBookingNotification } from "@/lib/email";
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

    // Verify hotel exists (include partner/user for notification)
    const hotel = await prisma.hotel.findUnique({
      where: { id, published: true },
      select: {
        id: true,
        name: true,
        partner: { select: { user: { select: { name: true, email: true } } } },
      },
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
      include: { room: true, hotel: true, user: { select: { name: true } } },
    });

    // Notify the partner — fire-and-forget so a mail failure never breaks the booking
    const partnerUser = hotel.partner?.user;
    if (partnerUser?.email) {
      const checkInLabel = checkInDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      const checkOutLabel = checkOutDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      sendPartnerBookingNotification({
        partnerEmail: partnerUser.email,
        partnerName: partnerUser.name ?? "Partner",
        guestName: session.user.name ?? session.user.email ?? "A guest",
        propertyName: hotel.name,
        propertyType: "hotel",
        bookingDetail: `${nights} night${nights !== 1 ? "s" : ""} · ${checkInLabel} – ${checkOutLabel} · ${body.guests} guest${body.guests > 1 ? "s" : ""}`,
      }).catch((err) => console.error("[partner-notify] hotel booking email failed:", err));
    }

    return NextResponse.json({ booking, nights }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/hotels/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

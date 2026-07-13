import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  quantity: z.number().int().min(1).max(10),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Sign in to purchase tickets." }, { status: 401 });
    }

    const { id } = await params;
    const { quantity } = schema.parse(await req.json());

    const event = await prisma.event.findUnique({
      where: { id },
      include: { _count: { select: { bookings: true } } },
    });

    if (!event || !event.published) {
      return NextResponse.json({ error: "Event not found." }, { status: 404 });
    }

    // Check capacity
    const totalBooked = await prisma.booking.aggregate({
      where: { eventId: id },
      _sum: { quantity: true },
    });
    const booked = totalBooked._sum.quantity ?? 0;
    if (booked + quantity > event.capacity) {
      return NextResponse.json(
        { error: `Only ${event.capacity - booked} tickets remaining.` },
        { status: 409 }
      );
    }

    const totalAmount = Number(event.price) * quantity;

    const booking = await prisma.booking.create({
      data: {
        userId: session.user.id,
        type: "EVENT",
        status: "CONFIRMED",
        quantity,
        totalAmount,
        currency: event.currency,
        eventId: id,
      },
    });

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/events/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

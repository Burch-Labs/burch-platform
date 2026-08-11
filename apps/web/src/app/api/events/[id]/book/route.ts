import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPartnerBookingNotification, sendGuestEventConfirmation } from "@/lib/email";
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
      select: {
        id: true,
        title: true,
        price: true,
        currency: true,
        capacity: true,
        published: true,
        startDate: true,
        partner: { select: { user: { select: { name: true, email: true } } } },
      },
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

    // Notify the partner — scheduled after response so mail latency never affects the guest
    const partnerUser = event.partner?.user;
    if (partnerUser?.email) {
      const dateLabel = event.startDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      const timeLabel = event.startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      after(() =>
        sendPartnerBookingNotification({
          partnerEmail: partnerUser.email,
          partnerName: partnerUser.name ?? "Partner",
          guestName: session.user.name ?? session.user.email ?? "A guest",
          propertyName: event.title,
          propertyType: "event",
          bookingDetail: `${quantity} ticket${quantity !== 1 ? "s" : ""} · ${dateLabel} at ${timeLabel}`,
        }).catch((err) => console.error("[partner-notify] event booking email failed:", err))
      );
    }

    // Confirm the guest — scheduled after response so mail latency never affects the guest
    const guestEmail = session.user.email;
    if (guestEmail) {
      after(() =>
        sendGuestEventConfirmation({
          guestEmail,
          guestName: session.user.name ?? guestEmail,
          eventTitle: event.title,
          eventDate: event.startDate,
          quantity,
          totalAmount,
          currency: event.currency,
        }).catch((err) => console.error("[guest-confirm] event booking email failed:", err))
      );
    }

    return NextResponse.json({ booking }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/events/[id]/book]", err);
    return NextResponse.json({ error: "Booking failed." }, { status: 500 });
  }
}

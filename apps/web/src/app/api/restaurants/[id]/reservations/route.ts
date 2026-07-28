import { NextRequest, NextResponse, after } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendPartnerBookingNotification, sendGuestReservationConfirmation } from "@/lib/email";
import { z } from "zod";

const schema = z.object({
  date: z.string().min(1, "Date is required."),
  time: z.string().min(1, "Time is required."),
  partySize: z.number().int().min(1).max(20),
  name: z.string().min(1, "Name is required.").max(120),
  email: z.string().email("Valid email required."),
  phone: z.string().optional(),
  notes: z.string().max(500).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Sign in to make a reservation." }, { status: 401 });
    }

    const { id } = await params;
    const body = schema.parse(await req.json());

    const restaurant = await prisma.restaurant.findUnique({
      where: { id, published: true },
      select: {
        id: true,
        name: true,
        partner: { select: { user: { select: { name: true, email: true } } } },
      },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    // Combine date + time into a DateTime
    const dateTime = new Date(`${body.date}T${body.time}:00`);
    if (isNaN(dateTime.getTime())) {
      return NextResponse.json({ error: "Invalid date or time." }, { status: 400 });
    }
    if (dateTime < new Date()) {
      return NextResponse.json({ error: "Reservation must be in the future." }, { status: 400 });
    }

    const reservation = await prisma.tableReservation.create({
      data: {
        restaurantId: id,
        userId: session.user.id,
        date: dateTime,
        partySize: body.partySize,
        name: body.name,
        email: body.email,
        phone: body.phone,
        notes: body.notes,
        status: "CONFIRMED",
      },
    });

    // Notify the partner — scheduled after response so mail latency never affects the guest
    const partnerUser = restaurant.partner?.user;
    if (partnerUser?.email) {
      const dateLabel = dateTime.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
      const timeLabel = dateTime.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
      after(() =>
        sendPartnerBookingNotification({
          partnerEmail: partnerUser.email,
          partnerName: partnerUser.name ?? "Partner",
          guestName: body.name,
          propertyName: restaurant.name,
          propertyType: "restaurant",
          bookingDetail: `${body.partySize} guest${body.partySize !== 1 ? "s" : ""} · ${dateLabel} at ${timeLabel}`,
        }).catch((err) => console.error("[partner-notify] restaurant reservation email failed:", err))
      );
    }

    // Confirm the guest — scheduled after response so mail latency never affects the guest
    after(() =>
      sendGuestReservationConfirmation({
        guestEmail: body.email,
        guestName: body.name,
        restaurantName: restaurant.name,
        dateTime,
        partySize: body.partySize,
      }).catch((err) => console.error("[guest-confirm] restaurant reservation email failed:", err))
    );

    return NextResponse.json({ reservation, restaurantName: restaurant.name }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/restaurants/[id]/reservations]", err);
    return NextResponse.json({ error: "Reservation failed." }, { status: 500 });
  }
}

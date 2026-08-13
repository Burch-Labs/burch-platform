"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export interface TicketLookup {
  error?: string;
  ticket?: {
    eventTitle: string;
    guestName: string;
    quantity: number;
    checkedInAt: string | null;
  };
}

async function loadTicket(token: string) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "PARTNER" && session.user.role !== "ADMIN")) {
    return { error: "Sign in as event staff to check in tickets." } as const;
  }

  const booking = await prisma.booking.findUnique({
    where: { checkInToken: token },
    select: {
      id: true,
      status: true,
      type: true,
      quantity: true,
      checkedInAt: true,
      user: { select: { name: true, email: true } },
      event: { select: { title: true, partnerId: true } },
    },
  });

  if (!booking || booking.type !== "EVENT" || !booking.event) {
    return { error: "Ticket not found. Check the code and try again." } as const;
  }
  if (booking.status !== "CONFIRMED") {
    return { error: "This ticket isn't confirmed — payment may still be pending, or it was cancelled." } as const;
  }

  if (session.user.role === "PARTNER") {
    const partner = await prisma.partner.findUnique({ where: { userId: session.user.id }, select: { id: true } });
    if (!partner || partner.id !== booking.event.partnerId) {
      return { error: "This ticket is for a different organizer's event." } as const;
    }
  }

  return { booking } as const;
}

/** Read-only lookup — shows the ticket and its status without checking anyone in. */
export async function getTicketForCheckIn(token: string): Promise<TicketLookup> {
  const result = await loadTicket(token);
  if ("error" in result) return { error: result.error };

  const { booking } = result;
  return {
    ticket: {
      eventTitle: booking.event!.title,
      guestName: booking.user.name ?? booking.user.email ?? "Guest",
      quantity: booking.quantity,
      checkedInAt: booking.checkedInAt ? booking.checkedInAt.toISOString() : null,
    },
  };
}

/** The actual check-in — only call this from a form/button submit, never on page load. */
export async function performCheckIn(token: string): Promise<TicketLookup> {
  const result = await loadTicket(token);
  if ("error" in result) return { error: result.error };

  const { booking } = result;

  const updated = booking.checkedInAt
    ? booking
    : await prisma.booking.update({
        where: { id: booking.id },
        data: { checkedInAt: new Date() },
      });

  revalidatePath("/partner/checkin");

  return {
    ticket: {
      eventTitle: booking.event!.title,
      guestName: booking.user.name ?? booking.user.email ?? "Guest",
      quantity: booking.quantity,
      checkedInAt: updated.checkedInAt ? updated.checkedInAt.toISOString() : null,
    },
  };
}

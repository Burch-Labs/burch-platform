import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkInTicket } from "@/lib/tickets";
import { isAdminRole } from "@/lib/roles";

const schema = z.object({
  token: z.string().min(1).max(500),
  eventId: z.string().min(1),
});

/**
 * Gate scanning. Admits a ticket exactly once.
 *
 * Authorisation is deliberately narrow: only the partner who owns the event, or
 * an admin, may scan it. Without that check any signed-in guest could POST
 * their own token and burn a stranger's ticket, turning a read into a denial of
 * service against the door.
 *
 * Every outcome returns 200 with a `status` the scanner UI renders. A refused
 * ticket is a normal business result at a gate, not a transport error, and
 * using HTTP codes to signal it would make an offline-tolerant scanner harder
 * to write. The one exception is authorisation, which is a real 401/403.
 */
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Sign in to scan tickets." }, { status: 401 });
  }

  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id: body.eventId },
    select: { id: true, partner: { select: { userId: true } } },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  const isOwner = event.partner?.userId === session.user.id;
  const isAdmin = isAdminRole(session.user.role);
  if (!isOwner && !isAdmin) {
    return NextResponse.json(
      { error: "You cannot scan tickets for this event." },
      { status: 403 }
    );
  }

  const result = await checkInTicket({
    token: body.token,
    eventId: body.eventId,
    scannedBy: session.user.id,
  });

  return NextResponse.json(result);
}

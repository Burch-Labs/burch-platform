import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { validateDiscountCode, DiscountError } from "@/lib/payments/ledger";

const schema = z.object({
  code: z.string().trim().min(1),
  quantity: z.number().int().min(1).max(10),
  ticketTierId: z.string().optional(),
});

/**
 * Preview-only: tells the checkout UI what a code is worth before the guest
 * commits to it, so "Apply" can show a real number instead of the guest
 * finding out at the very end. reserveEventBooking's transaction is still
 * the actual enforcement — this can say a code looks valid and it can still
 * lose a maxUses race between here and the real submit, same as capacity.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Sign in to apply a promo code." }, { status: 401 });
  }

  const { id } = await params;
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  const event = await prisma.event.findUnique({
    where: { id },
    select: { id: true, price: true, published: true },
  });
  if (!event || !event.published) {
    return NextResponse.json({ error: "Event not found." }, { status: 404 });
  }

  let unitPrice = Number(event.price);
  if (body.ticketTierId) {
    const tier = await prisma.ticketTier.findFirst({
      where: { id: body.ticketTierId, eventId: id, isActive: true },
      select: { price: true },
    });
    if (tier) unitPrice = Number(tier.price);
  }

  try {
    const applied = await validateDiscountCode({
      code: body.code,
      eventId: id,
      amount: unitPrice * body.quantity,
    });
    return NextResponse.json({
      discountApplied: applied.discountApplied,
      finalAmount: applied.finalAmount,
    });
  } catch (err) {
    if (err instanceof DiscountError) {
      return NextResponse.json({ error: err.message }, { status: 400 });
    }
    console.error("[POST /api/events/[id]/promo]", err);
    return NextResponse.json({ error: "Could not check that code." }, { status: 500 });
  }
}

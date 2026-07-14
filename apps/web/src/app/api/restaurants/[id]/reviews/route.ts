import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const schema = z.object({
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional(),
  comment: z.string().min(10, "Review must be at least 10 characters.").max(1000),
});

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const reviews = await prisma.restaurantReview.findMany({
    where: { restaurantId: id },
    include: { user: { select: { id: true, name: true, image: true } } },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json({ reviews });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Sign in to leave a review." }, { status: 401 });
    }

    const { id } = await params;
    const { rating, title, comment } = schema.parse(await req.json());

    const restaurant = await prisma.restaurant.findUnique({
      where: { id, published: true },
      select: { id: true },
    });
    if (!restaurant) {
      return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
    }

    const existing = await prisma.restaurantReview.findFirst({
      where: { restaurantId: id, userId: session.user.id },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this restaurant." },
        { status: 409 }
      );
    }

    const review = await prisma.restaurantReview.create({
      data: { restaurantId: id, userId: session.user.id, rating, title, comment },
      include: { user: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ review }, { status: 201 });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    console.error("[POST /api/restaurants/[id]/reviews]", err);
    return NextResponse.json({ error: "Failed to submit review." }, { status: 500 });
  }
}

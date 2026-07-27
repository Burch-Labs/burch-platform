import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const createSchema = z.object({
  name:     z.string().min(1).max(100),
  q:        z.string().max(200).optional().default(""),
  category: z.string().max(50).optional().default(""),
  city:     z.string().max(100).optional().default(""),
  dateFrom: z.string().max(20).optional().default(""),
  dateTo:   z.string().max(20).optional().default(""),
});

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searches = await prisma.savedSearch.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ searches });
}

export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid data", details: parsed.error.flatten() },
      { status: 422 }
    );
  }

  // Cap saved searches per user at 20
  const count = await prisma.savedSearch.count({
    where: { userId: session.user.id },
  });
  if (count >= 20) {
    return NextResponse.json(
      { error: "You have reached the maximum of 20 saved searches. Delete one to save a new search." },
      { status: 422 }
    );
  }

  const saved = await prisma.savedSearch.create({
    data: {
      userId:   session.user.id,
      name:     parsed.data.name,
      q:        parsed.data.q,
      category: parsed.data.category,
      city:     parsed.data.city,
      dateFrom: parsed.data.dateFrom,
      dateTo:   parsed.data.dateTo,
    },
  });

  return NextResponse.json({ search: saved }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  kind: z.enum(["hotelHappening", "hotelSpaOffer", "clubHappening"]),
  id: z.string().min(1),
});

/**
 * Fired when a guest opens a flyer from a Happenings/Spa/Club-offer card —
 * the only interaction available on these (no dedicated detail page to
 * increment on load, unlike Event.viewCount). Best-effort and unauthenticated
 * by design: a rough popularity signal for the main-page ranking, not an
 * analytics record, same spirit as the comment on Event.viewCount.
 */
export async function POST(req: NextRequest) {
  let body: z.infer<typeof schema>;
  try {
    body = schema.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    switch (body.kind) {
      case "hotelHappening":
        await prisma.hotelHappening.update({
          where: { id: body.id },
          data: { viewCount: { increment: 1 } },
        });
        break;
      case "hotelSpaOffer":
        await prisma.hotelSpaOffer.update({
          where: { id: body.id },
          data: { viewCount: { increment: 1 } },
        });
        break;
      case "clubHappening":
        await prisma.clubHappening.update({
          where: { id: body.id },
          data: { viewCount: { increment: 1 } },
        });
        break;
    }
  } catch (err) {
    // A missing/deleted id shouldn't surface as an error to the guest —
    // this is a click they already completed (the flyer opened regardless).
    console.error("[POST /api/offers/view]", err);
  }

  return NextResponse.json({ ok: true });
}

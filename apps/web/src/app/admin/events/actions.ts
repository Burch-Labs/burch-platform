"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin } from "@/lib/roles";

const schema = z.object({
  eventId: z.string().min(1),
  action: z.enum(["approve", "reject"]),
  reason: z.string().trim().max(300).optional(),
});

export type EventReviewState = { error?: string; message?: string };

/**
 * Approves or rejects a publicly submitted event.
 *
 * Restricted to SUPER_ADMIN, not just any admin — this is the one decision in
 * the admin section that puts a stranger's event in front of the public, so
 * it stays with the smaller, more trusted role rather than every admin.
 */
export async function reviewEventSubmission(
  _prev: EventReviewState,
  formData: FormData
): Promise<EventReviewState> {
  const session = await getServerSession(authOptions);
  if (!session || !isSuperAdmin(session.user.role)) {
    return { error: "Only a super admin can approve or reject events." };
  }

  const parsed = schema.safeParse({
    eventId: formData.get("eventId"),
    action: formData.get("action"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const approve = parsed.data.action === "approve";
  if (!approve && !parsed.data.reason?.trim()) {
    return { error: "Give a reason — the organizer sees it and needs it to fix the listing." };
  }

  const event = await prisma.event.findUnique({
    where: { id: parsed.data.eventId },
    select: { approvalStatus: true },
  });
  if (!event) return { error: "Event not found." };
  if (event.approvalStatus !== "PENDING") {
    return { error: "This event has already been reviewed." };
  }

  await prisma.event.update({
    where: { id: parsed.data.eventId },
    data: {
      approvalStatus: approve ? "APPROVED" : "REJECTED",
      published: approve,
      rejectionReason: approve ? null : parsed.data.reason,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
    },
  });

  if (approve) revalidateTag("events-listing");
  revalidatePath("/admin/events");
  revalidatePath("/partner/events");

  return { message: approve ? "Event approved and published." : "Event rejected." };
}

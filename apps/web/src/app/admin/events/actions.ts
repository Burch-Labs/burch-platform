"use server";

import { revalidatePath, revalidateTag } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole, isSuperAdmin } from "@/lib/roles";
import { sendEventApprovedEmail, sendEventRejectedEmail } from "@/lib/email";

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
    select: {
      approvalStatus: true,
      title: true,
      partner: { select: { user: { select: { email: true, name: true } } } },
    },
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

  if (approve) revalidateTag("events-listing", { expire: 0 });
  revalidatePath("/admin/events");
  revalidatePath("/partner/events");

  // Best-effort — the review itself has already gone through either way.
  const organizerEmail = event.partner.user.email;
  if (organizerEmail && !organizerEmail.endsWith("@phone.dontbeboring.invalid")) {
    const notify = approve
      ? sendEventApprovedEmail({
          toEmail: organizerEmail,
          toName: event.partner.user.name,
          eventTitle: event.title,
          eventId: parsed.data.eventId,
        })
      : sendEventRejectedEmail({
          toEmail: organizerEmail,
          toName: event.partner.user.name,
          eventTitle: event.title,
          reason: parsed.data.reason!,
        });
    notify.catch((err) => console.error("[reviewEventSubmission] notification failed", err));
  }

  return { message: approve ? "Event approved and published." : "Event rejected." };
}

/**
 * Toggles an event's homepage "Top Picks" curation flag. Purely editorial —
 * open to any admin, not just SUPER_ADMIN, since it can't put an unvetted
 * event in front of the public (published/approvalStatus are unaffected).
 */
export async function toggleEventFeatured(eventId: string, next: boolean) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    throw new Error("Not authorized.");
  }
  await prisma.event.update({
    where: { id: eventId },
    data: { isFeatured: next },
  });
  revalidatePath("/admin/events");
  revalidateTag("events-listing", { expire: 0 });
  revalidatePath("/");
}

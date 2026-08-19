"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { revalidateTag } from "next/cache";
import { EventCategory } from "@prisma/client";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { findOrCreatePartner } from "@/lib/partner-onboarding";
import { isAdminRole } from "@/lib/roles";
import { sendEventSubmissionReceived, sendEventSubmissionAdminAlert } from "@/lib/email";

export type SubmitEventState = { error?: string };

export async function submitEventForReview(
  _prev: SubmitEventState,
  data: FormData
): Promise<SubmitEventState> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/join?callbackUrl=/events/submit");

  const existingPartner = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  const businessName = (data.get("businessName") as string | null)?.trim();
  if (!existingPartner && !businessName) {
    return { error: "Business or organizer name is required." };
  }

  const title = (data.get("title") as string | null)?.trim();
  const location = (data.get("location") as string | null)?.trim();
  const city = (data.get("city") as string | null)?.trim();
  const price = parseFloat(data.get("price") as string);
  const capacity = parseInt(data.get("capacity") as string, 10);
  const startDate = new Date(data.get("startDate") as string);
  const endDate = new Date(data.get("endDate") as string);
  const images = (data.getAll("images") as string[]).map((s) => s.trim()).filter(Boolean).slice(0, 6);
  const termsAccepted = data.get("termsAccepted") === "true";

  if (!title) return { error: "Title is required." };
  if (!location) return { error: "Venue / location is required." };
  if (!city) return { error: "City is required." };
  if (isNaN(price)) return { error: "Price must be a number." };
  if (isNaN(capacity)) return { error: "Capacity must be a number." };
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return { error: "Start and end dates are required." };
  }
  if (!termsAccepted) {
    return { error: "You must accept the organizer terms & conditions to submit." };
  }

  const partner = existingPartner ?? (await findOrCreatePartner(session.user.id, businessName!));

  // An admin trying the public form doesn't need their own submission held
  // in a queue for themselves to approve.
  const autoApprove = isAdminRole(session.user.role);

  await prisma.event.create({
    data: {
      partnerId: partner.id,
      title,
      description: (data.get("description") as string | null)?.trim() || null,
      imageUrl: images[0] ?? null,
      images,
      category: (data.get("category") as EventCategory) ?? "OTHER",
      city,
      location,
      startDate,
      endDate,
      price,
      currency: (data.get("currency") as string | null)?.trim() || "KES",
      capacity,
      published: autoApprove,
      approvalStatus: autoApprove ? "APPROVED" : "PENDING",
      reviewedAt: autoApprove ? new Date() : null,
      reviewedBy: autoApprove ? session.user.id : null,
      termsAcceptedAt: new Date(),
    },
  });

  if (autoApprove) {
    revalidateTag("events-listing", { expire: 0 });
  } else {
    // Best-effort — a failed notification should never block the submission
    // itself, the organizer's own edit-to-resubmit path is the fallback.
    const notifications: Promise<void>[] = [
      sendEventSubmissionAdminAlert({ eventTitle: title, partnerName: partner.name, city }),
    ];
    // A phone-only signup has a placeholder, non-deliverable address — nothing to send to.
    if (session.user.email && !session.user.email.endsWith("@phone.dontbeboring.invalid")) {
      notifications.push(
        sendEventSubmissionReceived({
          toEmail: session.user.email,
          toName: session.user.name,
          eventTitle: title,
        })
      );
    }
    await Promise.all(notifications).catch((err) =>
      console.error("[submitEventForReview] notification failed", err)
    );
  }

  redirect("/events/submit/thanks");
}

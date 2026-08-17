"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/roles";

const schema = z.object({
  claimId: z.string().min(1),
  status: z.enum(["CONTACTED", "APPROVED", "REJECTED"]),
  note: z.string().trim().max(300).optional(),
});

export type ClaimReviewState = { error?: string; message?: string };

/**
 * Moves a claim along the queue.
 *
 * Deliberately does not touch the listing. Marking a claim APPROVED records
 * that we believe this person; handing them the listing is a separate act,
 * because it means changing a real business's public contact details and should
 * not happen as a side effect of clicking a status button.
 */
export async function reviewClaim(
  _prev: ClaimReviewState,
  formData: FormData
): Promise<ClaimReviewState> {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    return { error: "Only admins can review claims." };
  }

  const parsed = schema.safeParse({
    claimId: formData.get("claimId"),
    status: formData.get("status"),
    note: formData.get("note") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." };

  await prisma.venueClaim.update({
    where: { id: parsed.data.claimId },
    data: {
      status: parsed.data.status,
      reviewedAt: new Date(),
      reviewedBy: session.user.id,
      reviewNote: parsed.data.note || null,
    },
  });

  revalidatePath("/admin/claims");
  return { message: "Updated." };
}

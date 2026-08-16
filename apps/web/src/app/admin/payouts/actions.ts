"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { reviewPayoutAccount } from "@/lib/payouts";

const schema = z.object({
  partnerId: z.string().min(1),
  decision: z.enum(["VERIFIED", "REJECTED"]),
  rejectionReason: z.string().trim().max(300).optional(),
});

export type ReviewState = { error?: string; message?: string };

/**
 * Approves or refuses a payout account.
 *
 * Re-checks the admin role here rather than relying on the middleware alone.
 * Middleware guards the page; a server action is its own entry point and can be
 * invoked directly, so the thing that decides whether money may move must
 * verify the caller itself.
 */
export async function reviewPayout(
  _prev: ReviewState,
  formData: FormData
): Promise<ReviewState> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { error: "Only admins can review payout accounts." };
  }

  const parsed = schema.safeParse({
    partnerId: formData.get("partnerId"),
    decision: formData.get("decision"),
    rejectionReason: formData.get("rejectionReason") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." };

  if (parsed.data.decision === "REJECTED" && !parsed.data.rejectionReason?.trim()) {
    // A refusal with no reason leaves the partner unable to fix anything.
    return { error: "Give a reason so the partner knows what to correct." };
  }

  const { reviewed } = await reviewPayoutAccount({
    partnerId: parsed.data.partnerId,
    decision: parsed.data.decision,
    reviewedBy: session.user.id,
    rejectionReason: parsed.data.rejectionReason,
  });

  if (!reviewed) {
    // Someone else got there first, or the partner withdrew and resubmitted.
    return { error: "Nothing to review — this account is no longer awaiting a decision." };
  }

  revalidatePath("/admin/payouts");
  revalidatePath("/partner");
  return {
    message: parsed.data.decision === "VERIFIED" ? "Payouts enabled." : "Rejected, partner notified.",
  };
}

"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { setPartnerSuspension } from "@/lib/payouts";

const schema = z.object({
  partnerId: z.string().min(1),
  action: z.enum(["suspend", "reinstate"]),
  reason: z.string().trim().max(300).optional(),
});

export type SuspendState = { error?: string; message?: string };

/**
 * Suspends or reinstates a partner.
 *
 * Re-checks the admin role rather than relying on middleware: a server action is
 * its own entry point and can be invoked directly, and this one hides a
 * business's listings and stops their money.
 */
export async function togglePartnerSuspension(
  _prev: SuspendState,
  formData: FormData
): Promise<SuspendState> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { error: "Only admins can suspend partners." };
  }

  const parsed = schema.safeParse({
    partnerId: formData.get("partnerId"),
    action: formData.get("action"),
    reason: formData.get("reason") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." };

  const suspend = parsed.data.action === "suspend";
  if (suspend && !parsed.data.reason?.trim()) {
    return { error: "Give a reason — the partner sees it and needs it to put things right." };
  }

  const { changed } = await setPartnerSuspension({
    partnerId: parsed.data.partnerId,
    suspend,
    actedBy: session.user.id,
    reason: parsed.data.reason,
  });

  if (!changed) {
    return { error: "Nothing changed — this partner is already in that state." };
  }

  revalidatePath("/admin/partners");
  revalidatePath("/partner");
  return { message: suspend ? "Partner suspended." : "Partner reinstated." };
}

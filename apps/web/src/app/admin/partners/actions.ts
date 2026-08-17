"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { setPartnerSuspension } from "@/lib/payouts";
import {
  setPartnerCommissionRate,
  resetPartnerCommissionRate,
  InvalidCommissionRateError,
} from "@/lib/commission";

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

export type CommissionState = { error?: string; message?: string };

const commissionSchema = z.object({
  partnerId: z.string().min(1),
  action: z.enum(["set", "reset"]),
  rate: z.string().optional(),
});

/**
 * Sets or resets a partner's commission rate.
 *
 * Same admin re-check as suspension, for the same reason: a server action is
 * its own entry point, and this one decides how much of every future sale a
 * real business actually receives.
 */
export async function updatePartnerCommission(
  _prev: CommissionState,
  formData: FormData
): Promise<CommissionState> {
  const session = await getServerSession(authOptions);
  if (session?.user?.role !== "ADMIN") {
    return { error: "Only admins can change commission rates." };
  }

  const parsed = commissionSchema.safeParse({
    partnerId: formData.get("partnerId"),
    action: formData.get("action"),
    rate: formData.get("rate") ?? undefined,
  });
  if (!parsed.success) return { error: "Invalid request." };

  try {
    if (parsed.data.action === "reset") {
      await resetPartnerCommissionRate({ partnerId: parsed.data.partnerId, actedBy: session.user.id });
      revalidatePath("/admin/partners");
      revalidatePath("/partner");
      return { message: "Reset to the standard rate." };
    }

    const rate = Number(parsed.data.rate);
    if (!Number.isFinite(rate)) {
      return { error: "Enter a rate between 0 and 100." };
    }
    await setPartnerCommissionRate({ partnerId: parsed.data.partnerId, rate, actedBy: session.user.id });
    revalidatePath("/admin/partners");
    revalidatePath("/partner");
    return { message: `Rate set to ${rate}%.` };
  } catch (err) {
    if (err instanceof InvalidCommissionRateError) {
      return { error: err.message };
    }
    throw err;
  }
}

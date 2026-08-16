"use server";

import { revalidatePath } from "next/cache";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { submitPayoutDetails } from "@/lib/payouts";

const schema = z
  .object({
    legalName: z.string().trim().min(2, "Enter the name on your ID or certificate."),
    taxId: z.string().trim().min(4, "Enter your KRA PIN."),
    idNumber: z.string().trim().min(4, "Enter your ID or business registration number."),
    mpesaNumber: z.string().trim().optional(),
    bankName: z.string().trim().optional(),
    bankAccount: z.string().trim().optional(),
  })
  // One destination is the whole point of the form; verified details with
  // nowhere to send money would pass review and then fail at payout time.
  .refine(
    (v) => Boolean(v.mpesaNumber) || Boolean(v.bankName && v.bankAccount),
    { message: "Give either an M-Pesa number or a full bank account.", path: ["mpesaNumber"] }
  );

export type PayoutFormState = { error?: string; success?: boolean };

export async function savePayoutDetails(
  _prev: PayoutFormState,
  formData: FormData
): Promise<PayoutFormState> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: "Sign in to update your payout details." };

  // Scope by the session's own user rather than trusting a partner id from the
  // form — otherwise one partner could submit details against another's account.
  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) return { error: "Create your partner profile first." };

  const parsed = schema.safeParse({
    legalName: formData.get("legalName"),
    taxId: formData.get("taxId"),
    idNumber: formData.get("idNumber"),
    mpesaNumber: formData.get("mpesaNumber"),
    bankName: formData.get("bankName"),
    bankAccount: formData.get("bankAccount"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  await submitPayoutDetails(partner.id, parsed.data);

  revalidatePath("/partner");
  revalidatePath("/partner/payouts");
  return { success: true };
}

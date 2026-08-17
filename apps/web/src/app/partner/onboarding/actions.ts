"use server";

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { findOrCreatePartner } from "@/lib/partner-onboarding";

export type OnboardingState = { error?: string };

export async function createPartnerProfile(
  _prev: OnboardingState,
  data: FormData
): Promise<OnboardingState> {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/join?callbackUrl=/partner/onboarding");

  const name = (data.get("name") as string | null)?.trim();
  if (!name) return { error: "Business name is required." };

  await findOrCreatePartner(session.user.id, name);

  redirect("/partner");
}

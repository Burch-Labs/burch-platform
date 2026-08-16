"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendVenueClaimNotification } from "@/lib/email";

const VENUE_TYPES = ["hotel", "restaurant", "club"] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

const schema = z.object({
  type: z.enum(VENUE_TYPES),
  id: z.string().min(1),
  contactName: z.string().trim().min(2, "Tell us your name."),
  role: z.string().trim().min(2, "What is your role at the venue?"),
  workEmail: z.string().trim().email("Enter a valid email address."),
  phone: z.string().trim().min(7, "Enter a phone number we can reach you on."),
  website: z
    .string()
    .trim()
    .url("Enter a full web address, starting with https://")
    .optional()
    .or(z.literal("")),
});

export type ClaimState = { error?: string; success?: boolean };

/**
 * Records someone claiming a venue listing.
 *
 * Deliberately does not mark the listing verified or overwrite anything. A form
 * anyone can reach is not proof of employment, and a claim that immediately
 * rewrote a hotel's phone number would be a free redirect of that hotel's
 * enquiries to whoever filled it in first. It raises a lead; a person confirms
 * it before anything on the listing moves.
 */
export async function submitClaim(_prev: ClaimState, formData: FormData): Promise<ClaimState> {
  const parsed = schema.safeParse({
    type: formData.get("type"),
    id: formData.get("id"),
    contactName: formData.get("contactName"),
    role: formData.get("role"),
    workEmail: formData.get("workEmail"),
    phone: formData.get("phone"),
    website: formData.get("website") ?? "",
  });
  if (!parsed.success) return { error: parsed.error.errors[0].message };

  const { type, id, ...claim } = parsed.data;

  const venue =
    type === "hotel"
      ? await prisma.hotel.findUnique({ where: { id }, select: { name: true } })
      : type === "restaurant"
        ? await prisma.restaurant.findUnique({ where: { id }, select: { name: true } })
        : await prisma.club.findUnique({ where: { id }, select: { name: true } });

  if (!venue) return { error: "That listing no longer exists." };

  try {
    await sendVenueClaimNotification({
      venueName: venue.name,
      venueType: type,
      venueId: id,
      ...claim,
    });
  } catch (err) {
    // The claimant should not be told to try again because our mail failed on
    // our side; log it and let the success path stand.
    console.error("[claim] could not send claim notification:", err);
  }

  return { success: true };
}

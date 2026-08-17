"use server";

import { getServerSession } from "next-auth";
import { compare, hash } from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export type PasswordState = { error?: string; message?: string };

const schema = z.object({
  currentPassword: z.string().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

/**
 * Sets or changes the signed-in user's password.
 *
 * Most accounts here were created with the emailed-code flow and have never
 * had a password — for those, `currentPassword` is not asked and not
 * checked. An account that already has one must prove it first, the same
 * way any password change should.
 */
export async function setPassword(
  _prev: PasswordState,
  formData: FormData
): Promise<PasswordState> {
  const session = await getServerSession(authOptions);
  if (!session) return { error: "You must be signed in." };

  const parsed = schema.safeParse({
    currentPassword: formData.get("currentPassword") ?? undefined,
    newPassword: formData.get("newPassword"),
  });
  if (!parsed.success) {
    return { error: parsed.error.errors[0].message };
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true },
  });
  if (!user) return { error: "Account not found." };

  if (user.password) {
    const currentOk =
      !!parsed.data.currentPassword && (await compare(parsed.data.currentPassword, user.password));
    if (!currentOk) return { error: "Your current password is incorrect." };
  }

  const hashed = await hash(parsed.data.newPassword, 12);
  await prisma.user.update({ where: { id: session.user.id }, data: { password: hashed } });

  return { message: user.password ? "Password changed." : "Password set. You can now sign in with it at /auth/login." };
}

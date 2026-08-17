import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { PasswordForm } from "./PasswordForm";

export const metadata = { title: "Account settings — dontbeboring" };
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/join?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { password: true, email: true },
  });
  const hasPassword = !!user?.password;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Account settings</h1>
        <p className="text-sm text-gray-500 mb-8">{user?.email}</p>

        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h2 className="font-semibold text-gray-900 mb-1">
            {hasPassword ? "Change password" : "Set a password"}
          </h2>
          <p className="text-sm text-gray-500 mb-5">
            {hasPassword
              ? "You can also always sign in with an emailed code instead."
              : "Optional — the emailed code will keep working either way. Some people just prefer a password."}
          </p>
          <PasswordForm hasPassword={hasPassword} />
        </div>
      </main>
    </div>
  );
}

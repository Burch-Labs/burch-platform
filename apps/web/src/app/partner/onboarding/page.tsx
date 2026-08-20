import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { OnboardingForm } from "./OnboardingForm";

export const metadata = { title: "Set up your business — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function PartnerOnboardingPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/join?callbackUrl=/partner/onboarding");

  const existing = await prisma.partner.findUnique({ where: { userId: session.user.id } });
  if (existing) redirect("/partner");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-lg mx-auto px-6 py-12">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Set up your business</h1>
        <p className="text-sm text-gray-500 mb-8">
          A couple of details and you can start listing events, hotels, or restaurants.
        </p>
        <div className="bg-surface rounded-2xl border border-gray-200 p-6">
          <OnboardingForm />
        </div>
      </main>
    </div>
  );
}

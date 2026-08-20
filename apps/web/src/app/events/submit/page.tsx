import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { SubmitEventForm } from "./SubmitEventForm";

export const metadata = { title: "List your event — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function SubmitEventPage() {
  const session = await getServerSession(authOptions);

  const partner = session
    ? await prisma.partner.findUnique({ where: { userId: session.user.id }, select: { name: true } })
    : null;

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">List your event</h1>
        <p className="text-sm text-gray-500 mb-8">
          Anyone can submit an event. We review every submission before it goes live —
          usually within 24 hours.
        </p>

        {!session ? (
          <div className="bg-surface rounded-2xl border border-dashed border-gray-200 p-10 text-center">
            <p className="text-4xl mb-4">🎟️</p>
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Sign in to get started</h2>
            <p className="text-sm text-gray-500 mb-6 max-w-sm mx-auto">
              We'll email you a code — no password to remember. You'll land right back here.
            </p>
            <a
              href="/auth/join?callbackUrl=/events/submit"
              className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
            >
              Sign in to continue
            </a>
          </div>
        ) : (
          <div className="bg-surface rounded-2xl border border-gray-200 p-6">
            <SubmitEventForm existingBusinessName={partner?.name ?? null} />
          </div>
        )}
      </main>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { EventForm } from "../EventForm";
import { createEvent } from "../actions";
import { isAdminRole } from "@/lib/roles";

export default async function NewEventPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/partner/events" className="text-sm text-gray-500 hover:text-gray-700">
            ← My events
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900">New event</h1>
        </div>

        <div className="bg-surface rounded-2xl border border-gray-200 p-8">
          <EventForm action={createEvent} submitLabel="Create event" />
        </div>
      </main>
    </div>
  );
}

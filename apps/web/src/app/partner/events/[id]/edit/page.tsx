import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { EventForm } from "../../EventForm";
import { updateEvent } from "../../actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEventPage({ params }: Props) {
  const { id } = await params;

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

  const event = await prisma.event.findFirst({
    where: { id, partnerId: partner.id },
  });
  if (!event) notFound();

  // Bind the eventId into the action so the form only needs prev+data
  const boundUpdate = updateEvent.bind(null, event.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <Link href="/partner/events" className="text-sm text-gray-500 hover:text-gray-700">
            ← My events
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-2xl font-bold text-gray-900 truncate">{event.title}</h1>
        </div>

        {/* Manage tickets shortcut */}
        <div className="mb-6 flex items-center justify-between bg-white rounded-2xl border border-gray-200 px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-900">Tickets</p>
            <p className="text-xs text-gray-500 mt-0.5">Set up tiers (Early Bird, VIP) and promo codes for checkout</p>
          </div>
          <Link
            href={`/partner/events/${event.id}/tickets`}
            className="text-sm text-orange-600 hover:text-orange-700 font-medium px-4 py-2 rounded-xl hover:bg-orange-50 transition"
          >
            Manage tickets →
          </Link>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 p-8">
          <EventForm
            action={boundUpdate}
            submitLabel="Save changes"
            defaults={{
              title:       event.title,
              description: event.description ?? "",
              imageUrl:    event.imageUrl ?? "",
              category:    event.category,
              city:        event.city,
              location:    event.location,
              startDate:   event.startDate.toISOString(),
              endDate:     event.endDate.toISOString(),
              price:       String(event.price),
              currency:    event.currency,
              capacity:    String(event.capacity),
              published:   event.published,
            }}
          />
        </div>
      </main>
    </div>
  );
}

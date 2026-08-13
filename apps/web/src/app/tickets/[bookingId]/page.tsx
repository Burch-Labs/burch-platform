import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { configBaseUrl } from "@/lib/config-check";
import { checkInUrl, generateCheckInToken, qrCodeImageUrl } from "@/lib/tickets";
import { formatDateTime } from "@/lib/format";

interface PageProps {
  params: Promise<{ bookingId: string }>;
}

export default async function TicketPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");

  const { bookingId } = await params;
  let booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { event: { select: { title: true, startDate: true, location: true, city: true } } },
  });

  if (!booking || booking.userId !== session.user.id) notFound();
  if (booking.type !== "EVENT" || !booking.event) notFound();

  // Confirmed tickets booked before check-in tokens existed won't have one yet — backfill on first view.
  if (booking.status === "CONFIRMED" && !booking.checkInToken) {
    booking = await prisma.booking.update({
      where: { id: booking.id },
      data: { checkInToken: generateCheckInToken() },
      include: { event: { select: { title: true, startDate: true, location: true, city: true } } },
    });
  }

  if (booking.status !== "CONFIRMED" || !booking.checkInToken) {
    return (
      <>
        <NavBar />
        <main className="max-w-md mx-auto px-4 py-16 text-center">
          <p className="text-3xl mb-3">⏳</p>
          <p className="font-semibold text-gray-900 mb-1">Ticket not ready yet</p>
          <p className="text-sm text-gray-500 mb-6">
            {booking.status === "PENDING"
              ? "Your payment hasn't been confirmed yet — check back in a moment."
              : "This booking isn't confirmed."}
          </p>
          <Link href="/dashboard/bookings" className="text-sm text-orange-600 hover:underline">
            ← My bookings
          </Link>
        </main>
      </>
    );
  }

  const url = checkInUrl(configBaseUrl, booking.checkInToken);
  const qrSrc = qrCodeImageUrl(url, 220);

  return (
    <>
      <NavBar />
      <main className="max-w-md mx-auto px-4 py-12">
        <Link href="/dashboard/bookings" className="text-sm text-gray-400 hover:text-orange-600 transition mb-6 inline-block">
          ← My bookings
        </Link>

        <div className="bg-white rounded-3xl border border-gray-200 overflow-hidden shadow-sm">
          <div className="bg-orange-600 px-6 py-5 text-white">
            <p className="text-xs font-medium uppercase tracking-wide opacity-80 mb-1">Burch Ticket</p>
            <h1 className="text-lg font-bold">{booking.event.title}</h1>
          </div>

          <div className="p-6 text-center">
            {booking.checkedInAt ? (
              <div className="mb-4 inline-flex items-center gap-1.5 bg-green-50 text-green-700 text-xs font-medium px-3 py-1 rounded-full border border-green-200">
                ✓ Checked in
              </div>
            ) : null}

            <div className="bg-white border border-gray-100 rounded-2xl p-4 inline-block mb-4">
              <Image src={qrSrc} alt="Ticket QR code" width={220} height={220} unoptimized />
            </div>

            <p className="text-xs text-gray-400 mb-1">Show this at the door</p>
            <p className="font-mono text-lg tracking-widest text-gray-900 font-semibold mb-6">
              {booking.checkInToken}
            </p>

            <div className="text-left space-y-2 border-t border-gray-100 pt-4">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Date</span>
                <span className="text-gray-900 font-medium">{formatDateTime(booking.event.startDate)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Location</span>
                <span className="text-gray-900 font-medium">{booking.event.location}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Tickets</span>
                <span className="text-gray-900 font-medium">{booking.quantity}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

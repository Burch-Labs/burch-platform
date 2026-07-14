"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { formatCurrency, nightsBetween, formatDateShort } from "@/lib/format";

interface PageProps {
  params: Promise<{ id: string }>;
}

function BookingConfirm({ hotelId }: { hotelId: string }) {
  const router = useRouter();
  const params = useSearchParams();
  const { data: session, status } = useSession();

  const roomId = params.get("roomId") ?? "";
  const checkIn = params.get("checkIn") ?? "";
  const checkOut = params.get("checkOut") ?? "";
  const guests = Number(params.get("guests") ?? "1");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [bookingData, setBookingData] = useState<{
    booking: { id: string; totalAmount: number; currency: string };
    nights: number;
  } | null>(null);

  if (status === "loading") {
    return <div className="text-center py-20 text-gray-400">Loading…</div>;
  }

  if (!session) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-gray-500 mb-4">Sign in to complete your booking.</p>
        <Link
          href={`/auth/login?callbackUrl=/hotels/${hotelId}/book?roomId=${roomId}&checkIn=${checkIn}&checkOut=${checkOut}&guests=${guests}`}
          className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition"
        >
          Sign in
        </Link>
      </div>
    );
  }

  if (!roomId || !checkIn || !checkOut) {
    return (
      <div className="max-w-md mx-auto text-center py-20">
        <p className="text-gray-500 mb-4">Invalid booking parameters.</p>
        <Link href={`/hotels/${hotelId}`} className="text-orange-600 hover:underline">
          ← Back to hotel
        </Link>
      </div>
    );
  }

  const nights = nightsBetween(checkIn, checkOut);

  async function handleConfirm() {
    setError("");
    setLoading(true);
    const res = await fetch(`/api/hotels/${hotelId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ roomId, checkIn, checkOut, guests }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error ?? "Booking failed. Please try again.");
    } else {
      setBookingData(data);
      setConfirmed(true);
    }
  }

  if (confirmed && bookingData) {
    return (
      <div className="max-w-lg mx-auto py-16 text-center px-6">
        <div className="bg-white rounded-3xl border border-green-100 p-10 shadow-sm">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Booking confirmed!</h2>
          <p className="text-gray-500 mb-1">
            {bookingData.nights} night{bookingData.nights > 1 ? "s" : ""} ·{" "}
            {formatCurrency(bookingData.booking.totalAmount, bookingData.booking.currency)}
          </p>
          <p className="text-gray-400 text-sm mb-8">
            {formatDateShort(checkIn)} → {formatDateShort(checkOut)}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/dashboard"
              className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition"
            >
              View my bookings
            </Link>
            <Link
              href="/hotels"
              className="border border-gray-200 text-gray-600 px-6 py-3 rounded-xl font-medium hover:bg-gray-50 transition"
            >
              Browse more hotels
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6">
      <Link href={`/hotels/${hotelId}`} className="text-sm text-gray-400 hover:text-orange-600 transition mb-6 inline-block">
        ← Back to hotel
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-6">Confirm your booking</h1>

      <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-5">
        {/* Stay details */}
        <div className="grid grid-cols-2 gap-4">
          {[
            { label: "Check-in", value: formatDateShort(checkIn) },
            { label: "Check-out", value: formatDateShort(checkOut) },
            { label: "Duration", value: `${nights} night${nights > 1 ? "s" : ""}` },
            { label: "Guests", value: `${guests} guest${guests > 1 ? "s" : ""}` },
          ].map(({ label, value }) => (
            <div key={label} className="bg-gray-50 rounded-xl p-3">
              <p className="text-xs text-gray-400 mb-0.5">{label}</p>
              <p className="text-sm font-semibold text-gray-900">{value}</p>
            </div>
          ))}
        </div>

        <p className="text-xs text-gray-400 border-t border-gray-100 pt-4">
          Free cancellation may not be available. Check hotel policy on the detail page.
        </p>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          onClick={handleConfirm}
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3.5 rounded-xl font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Processing…" : "Confirm booking"}
        </button>

        <p className="text-xs text-center text-gray-400">
          By confirming you agree to the hotel&apos;s terms and conditions.
        </p>
      </div>
    </div>
  );
}

export default function BookPage({ params }: PageProps) {
  const [hotelId, setHotelId] = useState<string | null>(null);

  // Unwrap params
  if (!hotelId) {
    params.then(({ id }) => setHotelId(id));
    return (
      <div className="min-h-screen bg-gray-50">
        <NavBar />
        <div className="text-center py-20 text-gray-400">Loading…</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <Suspense fallback={<div className="text-center py-20 text-gray-400">Loading…</div>}>
        <BookingConfirm hotelId={hotelId} />
      </Suspense>
    </div>
  );
}

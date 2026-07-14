"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { Room } from "@prisma/client";
import { formatCurrency, nightsBetween, toDateInputValue } from "@/lib/format";
import { RoomCard } from "./RoomCard";

interface BookingFormProps {
  hotelId: string;
  rooms: Room[];
  isAuthenticated: boolean;
}

type AvailableRoom = Room & { availableCount: number; isAvailable: boolean };

export function BookingForm({ hotelId, rooms, isAuthenticated }: BookingFormProps) {
  const router = useRouter();
  const params = useSearchParams();

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  const [checkIn, setCheckIn] = useState(
    params.get("checkIn") ?? toDateInputValue(tomorrow)
  );
  const [checkOut, setCheckOut] = useState(
    params.get("checkOut") ?? toDateInputValue(dayAfter)
  );
  const [guests, setGuests] = useState(Number(params.get("guests") ?? "1"));
  const [available, setAvailable] = useState<AvailableRoom[] | null>(null);
  const [checking, setChecking] = useState(false);
  const [checked, setChecked] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);
  const isValid = checkIn && checkOut && new Date(checkOut) > new Date(checkIn);

  async function checkAvailability() {
    if (!isValid) return;
    setChecking(true);
    setChecked(false);
    const res = await fetch(
      `/api/hotels/${hotelId}/availability?checkIn=${checkIn}&checkOut=${checkOut}`
    );
    const data = await res.json();
    setChecking(false);
    setChecked(true);
    if (res.ok) setAvailable(data.rooms);
  }

  // Auto-check when dates change (debounced)
  useEffect(() => {
    if (!isValid) return;
    const t = setTimeout(checkAvailability, 500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkIn, checkOut]);

  return (
    <div>
      {/* Date & guest picker */}
      <div className="bg-white rounded-2xl border border-gray-100 p-5 mb-6">
        <h3 className="font-semibold text-gray-900 mb-4">Check availability</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Check-in</label>
            <input
              type="date"
              value={checkIn}
              min={toDateInputValue(new Date())}
              onChange={(e) => {
                setCheckIn(e.target.value);
                setChecked(false);
                // Ensure checkout is after checkin
                if (e.target.value >= checkOut) {
                  const d = new Date(e.target.value);
                  d.setDate(d.getDate() + 1);
                  setCheckOut(toDateInputValue(d));
                }
              }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Check-out</label>
            <input
              type="date"
              value={checkOut}
              min={checkIn}
              onChange={(e) => { setCheckOut(e.target.value); setChecked(false); }}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
        </div>
        <div className="mb-4">
          <label className="block text-xs text-gray-500 mb-1">Guests</label>
          <select
            value={guests}
            onChange={(e) => setGuests(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>
        {isValid && (
          <p className="text-xs text-gray-500 mb-4">
            {nights} night{nights > 1 ? "s" : ""} · {new Date(checkIn).toLocaleDateString("en-KE", { day: "numeric", month: "short" })} → {new Date(checkOut).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}
          </p>
        )}
        <button
          onClick={checkAvailability}
          disabled={!isValid || checking}
          className="w-full bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {checking ? "Checking…" : "Search rooms"}
        </button>
      </div>

      {/* Available rooms */}
      {checking && (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-40 bg-white rounded-2xl border border-gray-100 animate-pulse" />
          ))}
        </div>
      )}

      {checked && available && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">
            {available.filter((r) => r.isAvailable).length} room type{available.filter((r) => r.isAvailable).length !== 1 ? "s" : ""} available
          </p>
          {available.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              hotelId={hotelId}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              showBookButton={isAuthenticated}
            />
          ))}
          {!isAuthenticated && (
            <p className="text-center text-sm text-gray-500 pt-2">
              <a href={`/auth/login?callbackUrl=/hotels/${hotelId}`} className="text-orange-600 font-medium hover:underline">
                Sign in
              </a>{" "}
              to reserve a room.
            </p>
          )}
        </div>
      )}

      {/* Initial state — show all room types */}
      {!checked && !checking && (
        <div className="space-y-4">
          <p className="text-sm font-medium text-gray-700">All room types</p>
          {rooms.map((room) => (
            <RoomCard
              key={room.id}
              room={room}
              hotelId={hotelId}
              checkIn={checkIn}
              checkOut={checkOut}
              guests={guests}
              showBookButton={false}
            />
          ))}
        </div>
      )}
    </div>
  );
}

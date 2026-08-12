"use client";

import { useState } from "react";
import { toDateInputValue } from "@/lib/format";

interface ReservationFormProps {
  restaurantId: string;
  restaurantName: string;
  isAuthenticated: boolean;
}

const TIME_SLOTS = [
  "11:00", "11:30", "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "18:00", "18:30", "19:00", "19:30",
  "20:00", "20:30", "21:00", "21:30",
];

export function ReservationForm({ restaurantId, restaurantName, isAuthenticated }: ReservationFormProps) {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [date, setDate] = useState(toDateInputValue(tomorrow));
  const [time, setTime] = useState("19:00");
  const [partySize, setPartySize] = useState(2);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [confirmed, setConfirmed] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-5 text-center">
        <div className="text-3xl mb-3">🍽️</div>
        <p className="text-sm text-gray-600 mb-4">Sign in to make a table reservation.</p>
        <a
          href={`/auth/login?callbackUrl=/restaurants/${restaurantId}`}
          className="inline-block bg-orange-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
        >
          Sign in to reserve
        </a>
      </div>
    );
  }

  if (confirmed) {
    return (
      <div className="bg-white rounded-2xl border border-amber-100 p-6 text-center">
        <div className="text-4xl mb-3">📨</div>
        <h3 className="font-bold text-gray-900 mb-1">Request sent!</h3>
        <p className="text-sm text-gray-500 mb-1">
          {restaurantName}
        </p>
        <p className="text-sm font-medium text-gray-700 mb-4">
          {new Date(date).toLocaleDateString("en-KE", { weekday: "long", day: "numeric", month: "long" })} at {time} · {partySize} guest{partySize > 1 ? "s" : ""}
        </p>
        <p className="text-xs text-gray-400">
          The restaurant will confirm shortly — we&apos;ll email {email} either way.
        </p>
        <button
          onClick={() => setConfirmed(false)}
          className="mt-4 text-xs text-orange-600 hover:underline"
        >
          Make another request
        </button>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch(`/api/restaurants/${restaurantId}/reservations`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date, time, partySize, name, email, phone: phone || undefined, notes: notes || undefined }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) setError(data.error ?? "Reservation failed. Please try again.");
    else setConfirmed(true);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-5">
      <h3 className="font-semibold text-gray-900 mb-4">Reserve a table</h3>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Date</label>
            <input
              type="date"
              value={date}
              min={toDateInputValue(tomorrow)}
              onChange={(e) => setDate(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-500 mb-1">Time</label>
            <select
              value={time}
              onChange={(e) => setTime(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              {TIME_SLOTS.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-xs text-gray-500 mb-1">Party size</label>
          <select
            value={partySize}
            onChange={(e) => setPartySize(Number(e.target.value))}
            className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            {Array.from({ length: 20 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>{n} guest{n > 1 ? "s" : ""}</option>
            ))}
          </select>
        </div>

        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-500 mb-2">Contact details</p>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <input
              type="tel"
              placeholder="Phone (optional)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <textarea
              placeholder="Special requests or dietary requirements (optional)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {loading ? "Sending…" : "Request a table"}
        </button>
      </form>
    </div>
  );
}

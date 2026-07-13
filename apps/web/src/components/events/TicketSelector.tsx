"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

interface TicketSelectorProps {
  eventId: string;
  price: number;
  currency: string;
  remaining: number;
  isAuthenticated: boolean;
  loginUrl: string;
}

export function TicketSelector({
  eventId,
  price,
  currency,
  remaining,
  isAuthenticated,
  loginUrl,
}: TicketSelectorProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  const isFree = price === 0;
  const isSoldOut = remaining === 0;
  const maxQty = Math.min(10, remaining);
  const total = price * quantity;

  async function handleBook() {
    if (!isAuthenticated) {
      router.push(loginUrl);
      return;
    }

    setError("");
    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ quantity }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Booking failed. Please try again.");
    } else {
      setSuccess(true);
    }
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-800 mb-1">Booking confirmed!</p>
        <p className="text-sm text-green-700 mb-4">
          {quantity} ticket{quantity > 1 ? "s" : ""} for{" "}
          {isFree ? "free" : formatCurrency(total, currency)}
        </p>
        <button
          onClick={() => router.push("/dashboard")}
          className="text-sm text-green-700 underline hover:no-underline"
        >
          View my bookings →
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-700 mb-3">Select tickets</p>

      {isSoldOut ? (
        <div className="text-center py-4">
          <p className="text-gray-500 font-medium">Sold out</p>
          <p className="text-xs text-gray-400 mt-1">No tickets remaining</p>
        </div>
      ) : (
        <>
          {/* Quantity */}
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              −
            </button>
            <span className="w-8 text-center font-semibold text-gray-900">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(maxQty, q + 1))}
              disabled={quantity >= maxQty}
              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-700 hover:bg-gray-50 disabled:opacity-40 transition"
            >
              +
            </button>
            <span className="text-xs text-gray-400 ml-1">
              {remaining} available
            </span>
          </div>

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {formatCurrency(price, currency)} × {quantity}
              </span>
              <span>{formatCurrency(total, currency)}</span>
            </div>
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
              <span>Total</span>
              <span>{isFree ? "Free" : formatCurrency(total, currency)}</span>
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}

          <button
            onClick={handleBook}
            disabled={loading}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing…"
              : isAuthenticated
              ? isFree
                ? "Get free ticket"
                : `Buy ${quantity} ticket${quantity > 1 ? "s" : ""}`
              : "Sign in to buy tickets"}
          </button>
        </>
      )}
    </div>
  );
}

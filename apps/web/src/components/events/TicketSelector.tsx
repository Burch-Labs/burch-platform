"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

interface TicketSelectorProps {
  eventId: string;
  price: number;
  currency: string;
  remaining: number;
  isAuthenticated: boolean;
  loginUrl: string;
  hasMpesa: boolean;
  hasFlutterwave: boolean;
}

type PaymentMethod = "mpesa" | "flutterwave";
type Step = "select" | "awaiting-mpesa" | "success" | "failed";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export function TicketSelector({
  eventId,
  price,
  currency,
  remaining,
  isAuthenticated,
  loginUrl,
  hasMpesa,
  hasFlutterwave,
}: TicketSelectorProps) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod | null>(hasMpesa ? "mpesa" : hasFlutterwave ? "flutterwave" : null);
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [statusMessage, setStatusMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);

  const isFree = price === 0;
  const isSoldOut = remaining === 0;
  const maxQty = Math.min(10, remaining);
  const total = price * quantity;
  const paymentsConfigured = hasMpesa || hasFlutterwave;

  function pollBookingStatus(bookingId: string) {
    const startedAt = Date.now();
    pollRef.current = setInterval(async () => {
      if (Date.now() - startedAt > POLL_TIMEOUT_MS) {
        if (pollRef.current) clearInterval(pollRef.current);
        setStatusMessage("Still waiting on confirmation — check My Bookings in a moment.");
        return;
      }

      try {
        const res = await fetch(`/api/payments/status/${bookingId}`);
        if (!res.ok) return;
        const data = await res.json();

        if (data.bookingStatus === "CONFIRMED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("success");
        } else if (data.bookingStatus === "CANCELLED") {
          if (pollRef.current) clearInterval(pollRef.current);
          setStep("failed");
          setError("Payment was not completed. No charge was made.");
        }
      } catch {
        // transient network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);
  }

  async function handleBook() {
    if (!isAuthenticated) {
      router.push(loginUrl);
      return;
    }

    setError("");

    if (!isFree) {
      if (!method) {
        setError("Choose a payment method.");
        return;
      }
      if (method === "mpesa" && phone.trim().length < 9) {
        setError("Enter a valid M-Pesa phone number.");
        return;
      }
    }

    setLoading(true);

    const res = await fetch(`/api/events/${eventId}/book`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        isFree ? { quantity } : { quantity, method, phone: method === "mpesa" ? phone : undefined }
      ),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Booking failed. Please try again.");
      return;
    }

    if (isFree) {
      setStep("success");
      return;
    }

    if (method === "mpesa") {
      setStatusMessage(data.message ?? "Enter your M-Pesa PIN on your phone to complete payment.");
      setStep("awaiting-mpesa");
      pollBookingStatus(data.booking.id);
      return;
    }

    if (method === "flutterwave" && data.paymentLink) {
      window.location.href = data.paymentLink;
    }
  }

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-800 mb-1">Booking confirmed!</p>
        <p className="text-sm text-green-700 mb-4">
          {quantity} ticket{quantity > 1 ? "s" : ""} for{" "}
          {isFree ? "free" : formatCurrency(total, currency)}
        </p>
        <button
          onClick={() => router.push("/dashboard/bookings")}
          className="text-sm text-green-700 underline hover:no-underline"
        >
          View my bookings →
        </button>
      </div>
    );
  }

  if (step === "awaiting-mpesa") {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-center">
        <p className="text-2xl mb-2">📱</p>
        <p className="font-semibold text-amber-800 mb-1">Check your phone</p>
        <p className="text-sm text-amber-700">{statusMessage}</p>
      </div>
    );
  }

  if (step === "failed") {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center">
        <p className="font-semibold text-red-800 mb-1">Payment didn't go through</p>
        <p className="text-sm text-red-700 mb-4">{error}</p>
        <button
          onClick={() => {
            setStep("select");
            setError("");
          }}
          className="text-sm text-red-700 underline hover:no-underline"
        >
          Try again
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

          {/* Payment method (paid events only) */}
          {!isFree && isAuthenticated && (
            <div className="mb-4">
              {!paymentsConfigured ? (
                <p className="text-xs text-red-600 bg-red-50 rounded-lg p-2.5">
                  Payments aren't configured yet — this event can't be purchased right now.
                </p>
              ) : (
                <>
                  <p className="text-xs font-medium text-gray-500 mb-2">Pay with</p>
                  <div className="flex gap-2 mb-3">
                    {hasMpesa && (
                      <button
                        type="button"
                        onClick={() => setMethod("mpesa")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                          method === "mpesa"
                            ? "border-orange-600 bg-orange-50 text-orange-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        M-Pesa
                      </button>
                    )}
                    {hasFlutterwave && (
                      <button
                        type="button"
                        onClick={() => setMethod("flutterwave")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                          method === "flutterwave"
                            ? "border-orange-600 bg-orange-50 text-orange-700"
                            : "border-gray-200 text-gray-600 hover:bg-gray-50"
                        }`}
                      >
                        Card
                      </button>
                    )}
                  </div>
                  {method === "mpesa" && (
                    <input
                      type="tel"
                      inputMode="tel"
                      placeholder="M-Pesa phone e.g. 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-200"
                    />
                  )}
                </>
              )}
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 mb-3">{error}</p>
          )}

          <button
            onClick={handleBook}
            disabled={loading || (!isFree && isAuthenticated && !paymentsConfigured)}
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

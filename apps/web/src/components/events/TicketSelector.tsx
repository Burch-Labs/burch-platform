"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

export interface TierOption {
  id: string;
  name: string;
  price: number;
  currency: string;
  remaining: number;
}

interface TicketSelectorProps {
  eventId: string;
  price: number;
  currency: string;
  remaining: number;
  /** Empty when the event has no tiers — the flat price/currency/remaining above apply. */
  tiers: TierOption[];
  isAuthenticated: boolean;
  loginUrl: string;
  hasMpesa: boolean;
  hasPesapal: boolean;
}

type PaymentMethod = "mpesa" | "pesapal";
type Step = "select" | "awaiting-mpesa" | "success" | "failed";
type PromoStatus = "idle" | "checking" | "applied" | "error";

const POLL_INTERVAL_MS = 3000;
const POLL_TIMEOUT_MS = 120_000;

export function TicketSelector({
  eventId,
  price,
  currency,
  remaining,
  tiers,
  isAuthenticated,
  loginUrl,
  hasMpesa,
  hasPesapal,
}: TicketSelectorProps) {
  const router = useRouter();
  const hasTiers = tiers.length > 0;
  const [selectedTierId, setSelectedTierId] = useState<string | null>(
    hasTiers ? tiers.find((t) => t.remaining > 0)?.id ?? tiers[0].id : null
  );
  const selectedTier = tiers.find((t) => t.id === selectedTierId) ?? null;

  const unitPrice = selectedTier ? selectedTier.price : price;
  const unitCurrency = selectedTier ? selectedTier.currency : currency;
  const availableCount = selectedTier ? selectedTier.remaining : remaining;

  const [quantity, setQuantity] = useState(1);
  const [method, setMethod] = useState<PaymentMethod | null>(hasMpesa ? "mpesa" : hasPesapal ? "pesapal" : null);
  const [phone, setPhone] = useState("");
  const [payAtGate, setPayAtGate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState<Step>("select");
  const [statusMessage, setStatusMessage] = useState("");
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Promo code
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState<PromoStatus>("idle");
  const [promoError, setPromoError] = useState("");
  const [discountApplied, setDiscountApplied] = useState(0);

  useEffect(() => () => { if (pollRef.current) clearInterval(pollRef.current); }, []);
  // A tier/quantity change invalidates a previously-applied code's total.
  useEffect(() => { setPromoStatus("idle"); setDiscountApplied(0); }, [selectedTierId, quantity]);

  const isSoldOut = availableCount === 0;
  const maxQty = Math.min(10, availableCount);
  const rawTotal = unitPrice * quantity;
  const total = Math.max(0, rawTotal - (promoStatus === "applied" ? discountApplied : 0));
  const isFree = total === 0;
  const paymentsConfigured = hasMpesa || hasPesapal;

  async function handleApplyPromo() {
    if (!promoCode.trim()) return;
    setPromoStatus("checking");
    setPromoError("");
    try {
      const res = await fetch(`/api/events/${eventId}/promo`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: promoCode, quantity, ticketTierId: selectedTierId ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPromoStatus("error");
        setPromoError(data.error ?? "That code didn't work.");
        return;
      }
      setDiscountApplied(data.discountApplied);
      setPromoStatus("applied");
    } catch {
      setPromoStatus("error");
      setPromoError("Could not check that code — try again.");
    }
  }

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

    if (!isFree && !payAtGate) {
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
      body: JSON.stringify({
        quantity,
        ticketTierId: selectedTierId ?? undefined,
        promoCode: promoStatus === "applied" ? promoCode : undefined,
        payAtGate: !isFree && payAtGate ? true : undefined,
        method: isFree || payAtGate ? undefined : method,
        phone: !isFree && !payAtGate && method === "mpesa" ? phone : undefined,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Booking failed. Please try again.");
      return;
    }

    if (isFree || payAtGate) {
      setStep("success");
      return;
    }

    if (method === "mpesa") {
      setStatusMessage(data.message ?? "Enter your M-Pesa PIN on your phone to complete payment.");
      setStep("awaiting-mpesa");
      pollBookingStatus(data.booking.id);
      return;
    }

    if (method === "pesapal" && data.paymentLink) {
      window.location.href = data.paymentLink;
    }
  }

  if (step === "success") {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-2xl mb-2">🎉</p>
        <p className="font-semibold text-green-800 mb-1">
          {payAtGate && !isFree ? "Ticket reserved!" : "Booking confirmed!"}
        </p>
        <p className="text-sm text-green-700 mb-4">
          {quantity} ticket{quantity > 1 ? "s" : ""}
          {isFree
            ? " for free"
            : payAtGate
            ? ` — pay ${formatCurrency(total, unitCurrency)} at the door`
            : ` for ${formatCurrency(total, unitCurrency)}`}
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
    <div className="rounded-2xl border border-gray-200 bg-surface p-5 shadow-sm">
      <p className="text-sm font-medium text-gray-700 mb-3">Select tickets</p>

      {isSoldOut ? (
        <div className="text-center py-4">
          <p className="text-gray-500 font-medium">Sold out</p>
          <p className="text-xs text-gray-400 mt-1">No tickets remaining</p>
        </div>
      ) : (
        <>
          {/* Tier picker */}
          {hasTiers && (
            <div className="mb-4 space-y-2">
              {tiers.map((t) => {
                const soldOut = t.remaining === 0;
                return (
                  <button
                    key={t.id}
                    type="button"
                    disabled={soldOut}
                    onClick={() => { setSelectedTierId(t.id); setQuantity(1); }}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg border text-left transition ${
                      soldOut
                        ? "border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed"
                        : selectedTierId === t.id
                        ? "border-orange-600 bg-orange-50"
                        : "border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    <div>
                      <p className="text-sm font-medium text-gray-900">{t.name}</p>
                      <p className="text-xs text-gray-400">
                        {soldOut ? "Sold out" : `${t.remaining} left`}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.price === 0 ? "Free" : formatCurrency(t.price, t.currency)}
                    </p>
                  </button>
                );
              })}
            </div>
          )}

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
              {availableCount} available
            </span>
          </div>

          {/* Promo code */}
          {unitPrice > 0 && (
            <div className="mb-4">
              <p className="text-xs font-medium text-gray-500 mb-1.5">Have a promo code?</p>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={promoCode}
                  onChange={(e) => { setPromoCode(e.target.value); setPromoStatus("idle"); }}
                  placeholder="PROMO CODE"
                  className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-200"
                />
                <button
                  type="button"
                  onClick={handleApplyPromo}
                  disabled={!promoCode.trim() || promoStatus === "checking" || promoStatus === "applied"}
                  className="px-4 py-2 rounded-lg text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition"
                >
                  {promoStatus === "checking" ? "Checking…" : promoStatus === "applied" ? "Applied" : "Apply"}
                </button>
              </div>
              {promoStatus === "error" && <p className="text-xs text-red-600 mt-1">{promoError}</p>}
              {promoStatus === "applied" && (
                <p className="text-xs text-green-700 mt-1">
                  {formatCurrency(discountApplied, unitCurrency)} off applied
                </p>
              )}
            </div>
          )}

          {/* Price breakdown */}
          <div className="bg-gray-50 rounded-xl p-3 mb-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>
                {formatCurrency(unitPrice, unitCurrency)} × {quantity}
              </span>
              <span>{formatCurrency(rawTotal, unitCurrency)}</span>
            </div>
            {promoStatus === "applied" && discountApplied > 0 && (
              <div className="flex justify-between text-green-700">
                <span>Promo discount</span>
                <span>−{formatCurrency(discountApplied, unitCurrency)}</span>
              </div>
            )}
            <div className="flex justify-between font-semibold text-gray-900 border-t border-gray-200 pt-1.5">
              <span>Total</span>
              <span>{isFree ? "Free" : formatCurrency(total, unitCurrency)}</span>
            </div>
          </div>

          {/* Pay at the gate (paid tickets only) */}
          {!isFree && isAuthenticated && (
            <label className="mb-4 flex items-start gap-2.5 text-sm text-gray-700 bg-gray-50 rounded-lg p-3 cursor-pointer">
              <input
                type="checkbox"
                checked={payAtGate}
                onChange={(e) => setPayAtGate(e.target.checked)}
                className="w-4 h-4 mt-0.5 accent-orange-600 flex-shrink-0"
              />
              <span>
                <span className="font-medium text-gray-900">Pay at the gate</span>
                <br />
                <span className="text-xs text-gray-500">
                  Reserve now, pay cash or M-Pesa in person at the door. Your ticket is issued
                  right away either way.
                </span>
              </span>
            </label>
          )}

          {/* Payment method (paid, not pay-at-gate) */}
          {!isFree && !payAtGate && isAuthenticated && (
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
                    {hasPesapal && (
                      <button
                        type="button"
                        onClick={() => setMethod("pesapal")}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium border transition ${
                          method === "pesapal"
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
            disabled={loading || (!isFree && !payAtGate && isAuthenticated && !paymentsConfigured)}
            className="w-full bg-orange-600 text-white py-3 rounded-xl font-semibold text-sm hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading
              ? "Processing…"
              : !isAuthenticated
              ? "Sign in to buy tickets"
              : isFree
              ? "Get free ticket"
              : payAtGate
              ? `Reserve ${quantity} ticket${quantity > 1 ? "s" : ""} — pay at gate`
              : `Buy ${quantity} ticket${quantity > 1 ? "s" : ""}`}
          </button>
        </>
      )}
    </div>
  );
}

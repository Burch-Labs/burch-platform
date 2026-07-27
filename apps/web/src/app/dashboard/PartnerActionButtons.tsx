"use client";

import { useState, useTransition } from "react";
import {
  partnerConfirmBooking,
  partnerCancelBooking,
  partnerConfirmReservation,
  partnerCancelReservation,
} from "./actions";

interface BookingActionsProps {
  id: string;
  kind: "booking" | "reservation";
  status: string;
}

export function PartnerActionButtons({ id, kind, status }: BookingActionsProps) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleConfirm() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "booking"
          ? await partnerConfirmBooking(id)
          : await partnerConfirmReservation(id);
      if (result.error) setError(result.error);
    });
  }

  function handleCancel() {
    setError(null);
    startTransition(async () => {
      const result =
        kind === "booking"
          ? await partnerCancelBooking(id)
          : await partnerCancelReservation(id);
      if (result.error) {
        setError(result.error);
        setConfirming(false);
      } else {
        setConfirming(false);
      }
    });
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        {error && <span className="text-xs text-red-500">{error}</span>}
        <span className="text-xs text-gray-500">Cancel this?</span>
        <button
          onClick={handleCancel}
          disabled={isPending}
          className="text-xs font-medium text-white bg-red-500 hover:bg-red-600 disabled:opacity-60 px-2.5 py-1 rounded-lg transition"
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => { setConfirming(false); setError(null); }}
          disabled={isPending}
          className="text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 disabled:opacity-60 px-2.5 py-1 rounded-lg transition"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-red-500">{error}</span>}
      {status === "PENDING" && (
        <button
          onClick={handleConfirm}
          disabled={isPending}
          className="text-xs font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-60 px-2.5 py-1 rounded-lg transition"
        >
          {isPending ? "…" : "Confirm"}
        </button>
      )}
      {(status === "PENDING" || status === "CONFIRMED") && (
        <button
          onClick={() => setConfirming(true)}
          disabled={isPending}
          className="text-xs font-medium text-red-500 hover:text-red-600 border border-red-200 hover:border-red-300 hover:bg-red-50 disabled:opacity-60 px-2.5 py-1 rounded-lg transition"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

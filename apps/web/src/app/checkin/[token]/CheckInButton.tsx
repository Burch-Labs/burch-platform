"use client";

import { useState, useTransition } from "react";
import { performCheckIn, type TicketLookup } from "../actions";

interface CheckInButtonProps {
  token: string;
  initialCheckedInAt: string | null;
}

export function CheckInButton({ token, initialCheckedInAt }: CheckInButtonProps) {
  const [checkedInAt, setCheckedInAt] = useState(initialCheckedInAt);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  function handleCheckIn() {
    setError("");
    startTransition(async () => {
      const result: TicketLookup = await performCheckIn(token);
      if (result.error) {
        setError(result.error);
      } else if (result.ticket) {
        setCheckedInAt(result.ticket.checkedInAt);
      }
    });
  }

  if (checkedInAt) {
    return (
      <div className="rounded-2xl border border-green-200 bg-green-50 p-6 text-center">
        <p className="text-3xl mb-2">✅</p>
        <p className="font-semibold text-green-800">Checked in</p>
        <p className="text-sm text-green-700 mt-1">
          {new Date(checkedInAt).toLocaleString("en-KE", { dateStyle: "medium", timeStyle: "short" })}
        </p>
      </div>
    );
  }

  return (
    <div>
      {error && <p className="text-sm text-red-600 mb-3 text-center">{error}</p>}
      <button
        onClick={handleCheckIn}
        disabled={isPending}
        className="w-full bg-orange-600 text-white py-4 rounded-2xl font-semibold text-lg hover:bg-orange-700 transition disabled:opacity-50"
      >
        {isPending ? "Checking in…" : "Check in"}
      </button>
    </div>
  );
}

"use client";

import { useActionState } from "react";
import { reviewClaim, type ClaimReviewState } from "./actions";

const initial: ClaimReviewState = {};

const NEXT: { status: "CONTACTED" | "APPROVED" | "REJECTED"; label: string; primary?: boolean }[] = [
  { status: "CONTACTED", label: "Mark contacted" },
  { status: "APPROVED", label: "Confirmed", primary: true },
  { status: "REJECTED", label: "Not genuine" },
];

export function ClaimControls({ claimId }: { claimId: string }) {
  const [state, action, pending] = useActionState(reviewClaim, initial);

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="claimId" value={claimId} />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}
      <div className="flex flex-wrap gap-2">
        {NEXT.map(({ status, label, primary }) => (
          <button
            key={status}
            type="submit"
            name="status"
            value={status}
            disabled={pending}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition disabled:opacity-50 ${
              primary
                ? "bg-orange-600 text-white font-semibold hover:bg-orange-700"
                : "text-gray-600 border border-gray-200 hover:bg-gray-50"
            }`}
          >
            {label}
          </button>
        ))}
      </div>
    </form>
  );
}

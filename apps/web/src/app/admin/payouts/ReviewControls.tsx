"use client";

import { useActionState, useState } from "react";
import { reviewPayout, type ReviewState } from "./actions";

const initial: ReviewState = {};

export function ReviewControls({ partnerId }: { partnerId: string }) {
  const [state, action, pending] = useActionState(reviewPayout, initial);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");

  return (
    <form action={action} className="space-y-3">
      <input type="hidden" name="partnerId" value={partnerId} />

      {rejecting && (
        <div>
          <label htmlFor={`reason-${partnerId}`} className="block text-xs text-gray-500 mb-1">
            Why? The partner sees this.
          </label>
          <input
            id={`reason-${partnerId}`}
            name="rejectionReason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. KRA PIN does not match the business name"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}

      <div className="flex gap-2">
        {!rejecting ? (
          <>
            <button
              type="submit"
              name="decision"
              value="VERIFIED"
              disabled={pending}
              className="flex-1 bg-orange-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
            >
              {pending ? "Saving…" : "Approve payouts"}
            </button>
            <button
              type="button"
              onClick={() => setRejecting(true)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Reject
            </button>
          </>
        ) : (
          <>
            <button
              type="submit"
              name="decision"
              value="REJECTED"
              disabled={pending || !reason.trim()}
              className="flex-1 bg-gray-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-800 transition disabled:opacity-50"
            >
              {pending ? "Saving…" : "Confirm rejection"}
            </button>
            <button
              type="button"
              onClick={() => { setRejecting(false); setReason(""); }}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </form>
  );
}

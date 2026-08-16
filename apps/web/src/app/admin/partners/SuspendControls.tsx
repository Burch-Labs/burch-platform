"use client";

import { useActionState, useState } from "react";
import { togglePartnerSuspension, type SuspendState } from "./actions";

const initial: SuspendState = {};

export function SuspendControls({
  partnerId,
  suspended,
}: {
  partnerId: string;
  suspended: boolean;
}) {
  const [state, action, pending] = useActionState(togglePartnerSuspension, initial);
  const [confirming, setConfirming] = useState(false);
  const [reason, setReason] = useState("");

  if (suspended) {
    return (
      <form action={action} className="space-y-2">
        <input type="hidden" name="partnerId" value={partnerId} />
        <input type="hidden" name="action" value="reinstate" />
        {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition disabled:opacity-50"
        >
          {pending ? "Saving…" : "Reinstate"}
        </button>
      </form>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="partnerId" value={partnerId} />
      <input type="hidden" name="action" value="suspend" />

      {confirming && (
        <div>
          <label htmlFor={`reason-${partnerId}`} className="block text-xs text-gray-500 mb-1">
            Why? The partner sees this.
          </label>
          <input
            id={`reason-${partnerId}`}
            name="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. listing a property they do not operate"
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      )}

      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}

      {confirming ? (
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending || !reason.trim()}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50"
          >
            {pending ? "Saving…" : "Confirm suspension"}
          </button>
          <button
            type="button"
            onClick={() => { setConfirming(false); setReason(""); }}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setConfirming(true)}
          className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
        >
          Suspend
        </button>
      )}
    </form>
  );
}

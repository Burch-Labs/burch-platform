"use client";

import { useActionState, useState } from "react";
import { reviewEventSubmission, type EventReviewState } from "./actions";

const initial: EventReviewState = {};

export function EventReviewControls({ eventId, canReview }: { eventId: string; canReview: boolean }) {
  const [state, action, pending] = useActionState(reviewEventSubmission, initial);
  const [rejecting, setRejecting] = useState(false);

  if (!canReview) {
    return <p className="text-xs text-gray-400">Only a super admin can approve or reject.</p>;
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="eventId" value={eventId} />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}

      {rejecting ? (
        <div className="space-y-2">
          <textarea
            name="reason"
            required
            rows={2}
            placeholder="Why is this being rejected? The organizer will see this."
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
          <div className="flex gap-2">
            <button
              type="submit"
              name="action"
              value="reject"
              disabled={pending}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-50"
            >
              Confirm rejection
            </button>
            <button
              type="button"
              onClick={() => setRejecting(false)}
              className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <button
            type="submit"
            name="action"
            value="approve"
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm font-semibold bg-orange-600 text-white hover:bg-orange-700 transition disabled:opacity-50"
          >
            Approve & publish
          </button>
          <button
            type="button"
            onClick={() => setRejecting(true)}
            disabled={pending}
            className="px-4 py-2 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Reject
          </button>
        </div>
      )}
    </form>
  );
}

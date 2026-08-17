"use client";

import { useActionState, useEffect, useState } from "react";
import { updatePartnerCommission, type CommissionState } from "./actions";

const initial: CommissionState = {};

export function CommissionControls({
  partnerId,
  rate,
  isDefault,
}: {
  partnerId: string;
  rate: number;
  /** Whether this is still the standard rate — "Reset" is only shown once it isn't. */
  isDefault: boolean;
}) {
  const [state, action, pending] = useActionState(updatePartnerCommission, initial);
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(String(rate));

  // A successful save re-collapses the form. The parent's revalidatePath()
  // already refreshed `rate` by the time this runs, so collapsing loses
  // nothing — but only on success: an error leaves the form open with
  // whatever the admin typed still in it, rather than discarding a
  // correction they were mid-way through making.
  useEffect(() => {
    if (state.message) setEditing(false);
  }, [state.message]);

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-700">
          <span className="font-semibold">{rate}%</span> platform fee
          {!isDefault && <span className="text-xs text-orange-600 ml-1">(negotiated)</span>}
        </span>
        <button
          type="button"
          onClick={() => { setValue(String(rate)); setEditing(true); }}
          className="text-xs font-medium text-gray-500 hover:text-gray-900 underline"
        >
          Change
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-2">
      <input type="hidden" name="partnerId" value={partnerId} />
      {state.error && <p role="alert" className="text-sm text-red-600">{state.error}</p>}
      {state.message && <p role="status" className="text-sm text-green-700">{state.message}</p>}

      <div className="flex items-center gap-2">
        <label htmlFor={`rate-${partnerId}`} className="sr-only">Commission rate</label>
        <input
          id={`rate-${partnerId}`}
          name="rate"
          type="number"
          min={0}
          max={100}
          step={0.01}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="w-20 px-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        <span className="text-sm text-gray-500">%</span>
        <button
          type="submit"
          name="action"
          value="set"
          disabled={pending || value.trim() === ""}
          className="px-3 py-1.5 rounded-lg text-sm font-semibold bg-gray-900 text-white hover:bg-gray-800 transition disabled:opacity-50"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        {!isDefault && (
          <button
            type="submit"
            name="action"
            value="reset"
            disabled={pending}
            className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-600 border border-gray-200 hover:bg-gray-50 transition disabled:opacity-50"
          >
            Reset to standard
          </button>
        )}
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="px-3 py-1.5 rounded-lg text-sm font-medium text-gray-500 hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

"use client";

import { useActionState, useState } from "react";
import { submitClaim, type ClaimState, type VenueType } from "./actions";

const initial: ClaimState = {};

export function ClaimForm({ type, id }: { type: VenueType; id: string }) {
  const [state, action, pending] = useActionState(submitClaim, initial);
  // Controlled for the same reason as the payout form: React resets a form
  // after a server action, so an uncontrolled one loses everything typed the
  // moment a single field fails validation.
  const [v, setV] = useState({ contactName: "", role: "", workEmail: "", phone: "", website: "" });
  const bind = (k: keyof typeof v) => ({
    value: v[k],
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => setV((p) => ({ ...p, [k]: e.target.value })),
  });

  if (state.success) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8 text-center">
        <div className="text-3xl mb-3">✓</div>
        <h2 className="text-lg font-semibold text-gray-900 mb-1">Thanks — we have your claim</h2>
        <p className="text-sm text-gray-500">
          Someone will get in touch to confirm you work there. Nothing on the listing changes
          until then.
        </p>
      </div>
    );
  }

  return (
    <form action={action} className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="id" value={id} />

      <Field name="contactName" label="Your name" {...bind("contactName")} placeholder="Wanjiru Kamau" />
      <Field name="role" label="Your role there" {...bind("role")} placeholder="Reservations Manager" />
      <Field name="workEmail" label="Work email" {...bind("workEmail")} placeholder="you@venue.co.ke" />
      <Field name="phone" label="Phone" {...bind("phone")} placeholder="0712 345 678" />
      <Field
        name="website"
        label="Your booking page"
        optional
        {...bind("website")}
        placeholder="https://…"
      />

      {state.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        {pending ? "Sending…" : "Claim this listing"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        We confirm every claim by hand before a listing changes.
      </p>
    </form>
  );
}

function Field({
  name, label, value, onChange, placeholder, optional,
}: {
  name: string; label: string; value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder: string; optional?: boolean;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {optional && <span className="text-gray-400 font-normal"> — optional</span>}
      </label>
      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
      />
    </div>
  );
}

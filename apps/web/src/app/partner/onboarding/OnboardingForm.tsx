"use client";

import { useActionState } from "react";
import { createPartnerProfile, type OnboardingState } from "./actions";

const initial: OnboardingState = {};

export function OnboardingForm() {
  const [state, action, pending] = useActionState(createPartnerProfile, initial);

  return (
    <form action={action} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Business name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          placeholder="e.g. Savannah Events Co."
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {state?.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-60"
      >
        {pending ? "Setting up…" : "Continue"}
      </button>
    </form>
  );
}

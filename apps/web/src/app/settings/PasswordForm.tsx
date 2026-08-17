"use client";

import { useActionState, useEffect, useRef } from "react";
import { setPassword, type PasswordState } from "./actions";

const initial: PasswordState = {};

export function PasswordForm({ hasPassword }: { hasPassword: boolean }) {
  const [state, action, pending] = useActionState(setPassword, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.message) formRef.current?.reset();
  }, [state.message]);

  return (
    <form ref={formRef} action={action} className="space-y-4">
      {hasPassword && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Current password</label>
          <input
            name="currentPassword"
            type="password"
            required
            autoComplete="current-password"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          {hasPassword ? "New password" : "Password"}
        </label>
        <input
          name="newPassword"
          type="password"
          required
          minLength={8}
          autoComplete="new-password"
          placeholder="At least 8 characters"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state.message && (
        <p role="status" className="text-sm text-green-700 bg-green-50 border border-green-100 rounded-lg px-3 py-2">
          {state.message}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-60"
      >
        {pending ? "Saving…" : hasPassword ? "Change password" : "Set password"}
      </button>
    </form>
  );
}

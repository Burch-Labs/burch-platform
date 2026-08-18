"use client";

import { useActionState } from "react";

interface Props {
  action: (prev: { error?: string; success?: boolean } | null, data: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultJson: string;
}

export function ImportJsonForm({ action, defaultJson }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
          Saved — the hotel's live listing now reflects this data.
        </div>
      )}

      <textarea
        name="json"
        rows={22}
        defaultValue={defaultJson}
        spellCheck={false}
        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
      />

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-60"
        >
          {isPending ? "Saving…" : "Save JSON"}
        </button>
        <a
          href="/admin/hotels"
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Back to hotels
        </a>
      </div>
    </form>
  );
}

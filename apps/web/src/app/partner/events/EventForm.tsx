"use client";

import { useActionState } from "react";

const CATEGORIES = [
  { value: "MUSIC",      label: "Music" },
  { value: "SPORTS",     label: "Sports" },
  { value: "ARTS",       label: "Arts" },
  { value: "FOOD_DRINK", label: "Food & Drink" },
  { value: "TECH",       label: "Tech" },
  { value: "BUSINESS",   label: "Business" },
  { value: "COMEDY",     label: "Comedy" },
  { value: "FILM",       label: "Film" },
  { value: "EDUCATION",  label: "Education" },
  { value: "OTHER",      label: "Other" },
];

export interface EventFormDefaults {
  title?: string;
  description?: string;
  imageUrl?: string;
  category?: string;
  city?: string;
  location?: string;
  startDate?: string; // ISO string
  endDate?: string;
  price?: string;
  currency?: string;
  capacity?: string;
  published?: boolean;
}

interface Props {
  action: (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;
  defaults?: EventFormDefaults;
  submitLabel?: string;
  cancelHref?: string;
}

export function EventForm({ action, defaults = {}, submitLabel = "Save event", cancelHref = "/partner/events" }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Title <span className="text-red-500">*</span></label>
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title ?? ""}
          placeholder="e.g. Burna Boy Live in Nairobi"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={4}
          defaultValue={defaults.description ?? ""}
          placeholder="Tell attendees what to expect…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Image URL */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Image URL</label>
        <input
          name="imageUrl"
          type="url"
          defaultValue={defaults.imageUrl ?? ""}
          placeholder="https://example.com/poster.jpg"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Category + City */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue={defaults.category ?? "OTHER"}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-white"
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">City <span className="text-red-500">*</span></label>
          <input
            name="city"
            type="text"
            required
            defaultValue={defaults.city ?? ""}
            placeholder="e.g. Nairobi"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue / Location <span className="text-red-500">*</span></label>
        <input
          name="location"
          type="text"
          required
          defaultValue={defaults.location ?? ""}
          placeholder="e.g. KICC, Nairobi"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date & time <span className="text-red-500">*</span></label>
          <input
            name="startDate"
            type="datetime-local"
            required
            defaultValue={defaults.startDate ? toDatetimeLocal(defaults.startDate) : ""}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">End date & time <span className="text-red-500">*</span></label>
          <input
            name="endDate"
            type="datetime-local"
            required
            defaultValue={defaults.endDate ? toDatetimeLocal(defaults.endDate) : ""}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Price + Currency + Capacity */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Price <span className="text-red-500">*</span></label>
          <input
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            defaultValue={defaults.price ?? ""}
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
          <input
            name="currency"
            type="text"
            defaultValue={defaults.currency ?? "KES"}
            maxLength={3}
            placeholder="KES"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Capacity <span className="text-red-500">*</span></label>
          <input
            name="capacity"
            type="number"
            required
            min="1"
            step="1"
            defaultValue={defaults.capacity ?? ""}
            placeholder="100"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Published toggle */}
      <div className="flex items-start gap-3 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3">
        <input
          id="published"
          name="published"
          type="checkbox"
          value="true"
          defaultChecked={defaults.published ?? false}
          className="mt-0.5 h-4 w-4 accent-orange-600"
        />
        <div>
          <label htmlFor="published" className="block text-sm font-medium text-gray-700 cursor-pointer">
            Publish immediately
          </label>
          <p className="text-xs text-gray-400 mt-0.5">
            Published events appear on the homepage and events listing right away.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-60"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <a
          href={cancelHref}
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </a>
      </div>
    </form>
  );
}

/** Convert an ISO date string to the value needed by datetime-local inputs. */
function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    // datetime-local needs "YYYY-MM-DDTHH:mm"
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

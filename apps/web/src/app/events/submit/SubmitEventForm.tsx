"use client";

import { useActionState, useRef, useState } from "react";
import { submitEventForReview, type SubmitEventState } from "./actions";

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

const MAX_PHOTOS = 6;

const initial: SubmitEventState = {};

const TERMS_TEXT = `By submitting an event you confirm that:

1. You are authorised to sell tickets or admission for this event.
2. All details — dates, pricing, capacity, and venue — are accurate.
3. dontbeboring may reject or remove listings that are fraudulent, misleading, or violate local law.
4. Payouts follow the platform's standard commission rate unless a different rate has been agreed with you directly.
5. You are responsible for honouring every ticket sold through the platform.

Submissions are reviewed by our team, typically within 24 hours, before appearing publicly.`;

export function SubmitEventForm({ existingBusinessName }: { existingBusinessName: string | null }) {
  const [state, formAction, isPending] = useActionState(submitEventForReview, initial);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [termsOpen, setTermsOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (photos.length >= MAX_PHOTOS) {
      setUploadError(`You can add up to ${MAX_PHOTOS} photos.`);
      return;
    }

    setUploadError("");
    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed");
      } else {
        setPhotos((prev) => [...prev, json.url]);
      }
    } catch {
      setUploadError("Upload failed — please try again");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function removePhoto(url: string) {
    setPhotos((prev) => prev.filter((p) => p !== url));
  }

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Organizer / business name — only asked once, at first submission */}
      {!existingBusinessName ? (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Business / organizer name <span className="text-red-500">*</span>
          </label>
          <input
            name="businessName"
            type="text"
            required
            placeholder="e.g. Savannah Events Co."
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-500">
          Submitting as <span className="font-medium text-gray-900">{existingBusinessName}</span>.
        </p>
      )}

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Event title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          placeholder="e.g. Burna Boy Live in Nairobi"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={4}
          placeholder="Tell attendees what to expect…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Event photos <span className="text-gray-400 font-normal">(up to {MAX_PHOTOS})</span>
        </label>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2 mb-3">
            {photos.map((url) => (
              <div key={url} className="relative h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Event photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removePhoto(url)}
                  className="absolute top-1 right-1 bg-white/80 hover:bg-white text-gray-700 rounded-full p-0.5 shadow transition"
                  title="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <input type="hidden" name="images" value={url} />
              </div>
            ))}
          </div>
        )}

        {photos.length < MAX_PHOTOS && (
          <div
            className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition ${
              isUploading ? "border-orange-200 bg-orange-50 cursor-wait" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            }`}
            onClick={() => !isUploading && fileInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <div>
              <p className="text-sm text-gray-600 font-medium">{isUploading ? "Uploading…" : "Add a photo"}</p>
              <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP or GIF · max 5 MB each</p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleFileChange}
              disabled={isUploading}
            />
          </div>
        )}
        {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Category</label>
          <select
            name="category"
            defaultValue="OTHER"
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
            placeholder="e.g. Nairobi"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Venue / location <span className="text-red-500">*</span></label>
        <input
          name="location"
          type="text"
          required
          placeholder="e.g. KICC, Nairobi"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Start date & time <span className="text-red-500">*</span></label>
          <input
            name="startDate"
            type="datetime-local"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">End date & time <span className="text-red-500">*</span></label>
          <input
            name="endDate"
            type="datetime-local"
            required
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ticket rate <span className="text-red-500">*</span></label>
          <input
            name="price"
            type="number"
            required
            min="0"
            step="0.01"
            placeholder="0.00"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Currency</label>
          <input
            name="currency"
            type="text"
            defaultValue="KES"
            maxLength={3}
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
            placeholder="100"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Terms & conditions */}
      <div className="rounded-xl border border-gray-200 overflow-hidden">
        <button
          type="button"
          onClick={() => setTermsOpen((v) => !v)}
          className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 text-sm font-medium text-gray-700 hover:bg-gray-100 transition"
        >
          Organizer terms & conditions
          <span className="text-gray-400">{termsOpen ? "Hide" : "Read"}</span>
        </button>
        {termsOpen && (
          <div className="px-4 py-3 text-xs text-gray-500 whitespace-pre-line max-h-48 overflow-y-auto border-t border-gray-200">
            {TERMS_TEXT}
          </div>
        )}
        <label className="flex items-start gap-3 px-4 py-3 border-t border-gray-200 cursor-pointer">
          <input
            type="checkbox"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-0.5 h-4 w-4 accent-orange-600"
          />
          <span className="text-sm text-gray-700">
            I have read and agree to the organizer terms & conditions above.
          </span>
        </label>
        <input type="hidden" name="termsAccepted" value={termsAccepted ? "true" : "false"} />
      </div>

      <button
        type="submit"
        disabled={isPending || isUploading || !termsAccepted}
        className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        {isPending ? "Submitting…" : "Submit for review"}
      </button>
      <p className="text-xs text-gray-400 text-center">
        We review new events within 24 hours before they go live.
      </p>
    </form>
  );
}

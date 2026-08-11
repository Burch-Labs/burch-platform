"use client";

import { useActionState, useRef, useState } from "react";

const PRICE_RANGE_OPTIONS = [
  { value: "", label: "Not specified" },
  { value: "1", label: "$ — Budget-friendly" },
  { value: "2", label: "$$ — Moderate" },
  { value: "3", label: "$$$ — Upscale" },
  { value: "4", label: "$$$$ — Fine dining" },
];

export interface RestaurantFormDefaults {
  name?: string;
  description?: string;
  imageUrl?: string;
  city?: string;
  location?: string;
  cuisine?: string;
  priceRange?: string;
  phone?: string;
  email?: string;
  website?: string;
  amenities?: string; // comma-separated
  published?: boolean;
}

interface Props {
  action: (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;
  defaults?: RestaurantFormDefaults;
  submitLabel?: string;
  cancelHref?: string;
}

export function RestaurantForm({
  action,
  defaults = {},
  submitLabel = "Save restaurant",
  cancelHref = "/partner/restaurants",
}: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(defaults.imageUrl ?? "");

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreviewSrc(URL.createObjectURL(file));
    setUploadError("");
    setIsUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) {
        setUploadError(json.error ?? "Upload failed");
        setUploadedUrl("");
        setPreviewSrc(defaults.imageUrl ?? "");
      } else {
        setUploadedUrl(json.url);
      }
    } catch {
      setUploadError("Upload failed — please try again");
      setUploadedUrl("");
      setPreviewSrc(defaults.imageUrl ?? "");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveImage() {
    setUploadedUrl("");
    setPreviewSrc("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const effectiveImageUrl = uploadedUrl || previewSrc;

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Restaurant name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="e.g. Carnivore Restaurant"
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
          placeholder="Describe your restaurant, cuisine highlights, atmosphere…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Cover photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover photo</label>

        {previewSrc && !uploadError && (
          <div className="relative mb-3 w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Restaurant photo preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow transition"
              title="Remove photo"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            {isUploading && (
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-sm font-medium">Uploading…</span>
              </div>
            )}
          </div>
        )}

        <div
          className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-4 cursor-pointer transition ${
            isUploading
              ? "border-orange-200 bg-orange-50 cursor-wait"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              {isUploading ? "Uploading…" : previewSrc && !uploadError ? "Replace photo" : "Upload a photo"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG, WebP or GIF · max 5 MB</p>
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

        {uploadError && <p className="mt-1.5 text-xs text-red-600">{uploadError}</p>}
        <input type="hidden" name="imageUrl" value={effectiveImageUrl} />
      </div>

      {/* City + Cuisine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            City <span className="text-red-500">*</span>
          </label>
          <input
            name="city"
            type="text"
            required
            defaultValue={defaults.city ?? ""}
            placeholder="e.g. Nairobi"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Cuisine type</label>
          <input
            name="cuisine"
            type="text"
            defaultValue={defaults.cuisine ?? ""}
            placeholder="e.g. African, Italian, Seafood"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Address */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Address / Location <span className="text-red-500">*</span>
        </label>
        <input
          name="location"
          type="text"
          required
          defaultValue={defaults.location ?? ""}
          placeholder="e.g. Langata Road, Karen"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Price range */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Price range</label>
        <select
          name="priceRange"
          defaultValue={defaults.priceRange ?? ""}
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-white"
        >
          {PRICE_RANGE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Features &amp; amenities</label>
        <input
          name="amenities"
          type="text"
          defaultValue={defaults.amenities ?? ""}
          placeholder="e.g. Outdoor seating, Live music, Valet parking"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">Separate with commas</p>
      </div>

      {/* Phone + Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Phone</label>
          <input
            name="phone"
            type="tel"
            defaultValue={defaults.phone ?? ""}
            placeholder="+254 700 000 000"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
          <input
            name="email"
            type="email"
            defaultValue={defaults.email ?? ""}
            placeholder="info@yourrestaurant.com"
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Website */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Website</label>
        <input
          name="website"
          type="url"
          defaultValue={defaults.website ?? ""}
          placeholder="https://yourrestaurant.com"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
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
            Published restaurants appear on the restaurants listing page right away.
          </p>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || isUploading}
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

"use client";

import { useActionState, useRef, useState } from "react";

const STAR_OPTIONS = [
  { value: "", label: "No rating" },
  { value: "1", label: "1 ★" },
  { value: "2", label: "2 ★★" },
  { value: "3", label: "3 ★★★" },
  { value: "4", label: "4 ★★★★" },
  { value: "5", label: "5 ★★★★★" },
];

export interface HotelFormDefaults {
  name?: string;
  description?: string;
  imageUrl?: string;
  images?: string[];
  city?: string;
  location?: string;
  starRating?: string;
  amenities?: string; // comma-separated
  phone?: string;
  email?: string;
  website?: string;
  checkInTime?: string;
  checkOutTime?: string;
  published?: boolean;
}

const MAX_GALLERY_PHOTOS = 8;

interface Props {
  action: (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;
  defaults?: HotelFormDefaults;
  submitLabel?: string;
  cancelHref?: string;
}

export function HotelForm({ action, defaults = {}, submitLabel = "Save hotel", cancelHref = "/partner/hotels" }: Props) {
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

  // Gallery photos — separate from the single cover photo above.
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [gallery, setGallery] = useState<string[]>(defaults.images ?? []);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const [galleryError, setGalleryError] = useState("");

  async function handleGalleryFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (gallery.length >= MAX_GALLERY_PHOTOS) {
      setGalleryError(`You can add up to ${MAX_GALLERY_PHOTOS} gallery photos.`);
      return;
    }
    setGalleryError("");
    setGalleryUploading(true);
    const body = new FormData();
    body.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body });
      const json = await res.json();
      if (!res.ok || json.error) {
        setGalleryError(json.error ?? "Upload failed");
      } else {
        setGallery((prev) => [...prev, json.url]);
      }
    } catch {
      setGalleryError("Upload failed — please try again");
    } finally {
      setGalleryUploading(false);
      if (galleryInputRef.current) galleryInputRef.current.value = "";
    }
  }

  function removeGalleryPhoto(url: string) {
    setGallery((prev) => prev.filter((p) => p !== url));
  }

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
          Hotel name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="e.g. Serena Hotel Nairobi"
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
          placeholder="Describe your property, highlights, atmosphere…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Cover photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Cover photo</label>

        {previewSrc && !uploadError && (
          <div className="relative mb-3 w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Hotel photo preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveImage}
              className="absolute top-2 right-2 bg-surface/80 hover:bg-surface text-gray-700 rounded-full p-1 shadow transition"
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

      {/* Gallery photos */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Gallery photos <span className="text-gray-400 font-normal">(up to {MAX_GALLERY_PHOTOS})</span>
        </label>

        {gallery.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 mb-3">
            {gallery.map((url) => (
              <div key={url} className="relative h-20 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={url} alt="Hotel gallery photo" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeGalleryPhoto(url)}
                  className="absolute top-1 right-1 bg-surface/80 hover:bg-surface text-gray-700 rounded-full p-0.5 shadow transition"
                  title="Remove photo"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </button>
                <input type="hidden" name="images" value={url} />
              </div>
            ))}
          </div>
        )}

        {gallery.length < MAX_GALLERY_PHOTOS && (
          <div
            className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-4 py-3 cursor-pointer transition ${
              galleryUploading ? "border-orange-200 bg-orange-50 cursor-wait" : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
            }`}
            onClick={() => !galleryUploading && galleryInputRef.current?.click()}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            <p className="text-sm text-gray-600 font-medium">
              {galleryUploading ? "Uploading…" : "Add a gallery photo"}
            </p>
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleGalleryFileChange}
              disabled={galleryUploading}
            />
          </div>
        )}
        {galleryError && <p className="mt-1.5 text-xs text-red-600">{galleryError}</p>}
      </div>

      {/* City + Star rating */}
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
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Star rating</label>
          <select
            name="starRating"
            defaultValue={defaults.starRating ?? ""}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent bg-surface"
          >
            {STAR_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
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
          placeholder="e.g. Processional Way, Upper Hill"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Amenities</label>
        <input
          name="amenities"
          type="text"
          defaultValue={defaults.amenities ?? ""}
          placeholder="e.g. WiFi, Pool, Gym, Parking, Restaurant"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
        <p className="mt-1 text-xs text-gray-400">Separate with commas</p>
      </div>

      {/* Check-in / Check-out */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-in time</label>
          <input
            name="checkInTime"
            type="time"
            defaultValue={defaults.checkInTime ?? "14:00"}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Check-out time</label>
          <input
            name="checkOutTime"
            type="time"
            defaultValue={defaults.checkOutTime ?? "11:00"}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
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
            placeholder="info@yourhotel.com"
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
          placeholder="https://yourhotel.com"
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
            Published hotels appear on the hotels listing page right away.
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

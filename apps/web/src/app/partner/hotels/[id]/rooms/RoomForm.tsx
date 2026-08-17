"use client";

import { useActionState, useEffect, useRef, useState } from "react";

const CURRENCIES = ["KES", "USD", "EUR", "GBP", "TZS", "UGX", "ZAR"];
const BED_TYPES = ["Single", "Double", "Queen", "King", "Twin", "Bunk", "Sofa bed", "Other"];

interface RoomDefaults {
  name: string;
  description: string;
  imageUrl: string;
  price: string;
  currency: string;
  capacity: string;
  maxGuests: string;
  bedType: string;
  amenities: string;
  quantity: string;
  available: boolean;
}

interface Props {
  action: (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;
  defaults?: Partial<RoomDefaults>;
  submitLabel?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function RoomForm({ action, defaults = {}, submitLabel = "Add room", onSuccess, onCancel }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  // Image upload state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(defaults.imageUrl ?? "");

  useEffect(() => {
    if (state && !state.error && onSuccess) {
      onSuccess();
    }
  }, [state, onSuccess]);

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
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3">
          {state.error}
        </div>
      )}

      {/* Name */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room name <span className="text-red-500">*</span>
        </label>
        <input
          name="name"
          type="text"
          required
          defaultValue={defaults.name ?? ""}
          placeholder="e.g. Deluxe King Room"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults.description ?? ""}
          placeholder="Briefly describe the room…"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
        />
      </div>

      {/* Room photo */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Room photo</label>

        {/* Hidden field carries the URL into the form submission */}
        <input type="hidden" name="imageUrl" value={effectiveImageUrl} />

        {effectiveImageUrl && !uploadError && (
          <div className="relative mb-2 w-full h-36 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={effectiveImageUrl} alt="Room photo preview" className="w-full h-full object-cover" />
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

        {uploadError && (
          <p className="text-xs text-red-600 mb-2">{uploadError}</p>
        )}

        <div
          className={`flex items-center gap-3 border-2 border-dashed rounded-xl px-3 py-3 cursor-pointer transition ${
            isUploading
              ? "border-orange-200 bg-orange-50 cursor-wait"
              : "border-gray-200 hover:border-orange-300 hover:bg-orange-50"
          }`}
          onClick={() => !isUploading && fileInputRef.current?.click()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
          </svg>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              {isUploading ? "Uploading…" : effectiveImageUrl && !uploadError ? "Replace photo" : "Upload a photo"}
            </p>
            <p className="text-xs text-gray-400 mt-0.5">JPEG, PNG or WebP · max 5 MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </div>
      </div>

      {/* Price + Currency */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Price / night <span className="text-red-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="1"
            step="0.01"
            required
            defaultValue={defaults.price ?? ""}
            placeholder="5000"
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
          <select
            name="currency"
            defaultValue={defaults.currency ?? "KES"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
          >
            {CURRENCIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Quantity + Capacity + Max Guests */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Rooms available</label>
          <input
            name="quantity"
            type="number"
            min="1"
            defaultValue={defaults.quantity ?? "1"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
          <input
            name="capacity"
            type="number"
            min="1"
            defaultValue={defaults.capacity ?? "1"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Max guests</label>
          <input
            name="maxGuests"
            type="number"
            min="1"
            defaultValue={defaults.maxGuests ?? "2"}
            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      {/* Bed type */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Bed type</label>
        <select
          name="bedType"
          defaultValue={defaults.bedType ?? ""}
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
        >
          <option value="">— select —</option>
          {BED_TYPES.map((b) => (
            <option key={b} value={b}>{b}</option>
          ))}
        </select>
      </div>

      {/* Amenities */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Room amenities
          <span className="text-gray-400 font-normal ml-1">(comma-separated)</span>
        </label>
        <input
          name="amenities"
          type="text"
          defaultValue={defaults.amenities ?? ""}
          placeholder="e.g. Air conditioning, Mini bar, Safe"
          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Available */}
      <div className="flex items-center gap-2">
        <input
          id="available"
          name="available"
          type="checkbox"
          defaultChecked={defaults.available !== false}
          className="w-4 h-4 accent-orange-600"
        />
        <label htmlFor="available" className="text-sm font-medium text-gray-700">
          Available for booking
        </label>
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending || isUploading}
          className="bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition"
        >
          {isPending ? "Saving…" : isUploading ? "Uploading…" : submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="text-sm text-gray-500 hover:text-gray-700 px-4 py-2 rounded-xl hover:bg-gray-100 transition"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

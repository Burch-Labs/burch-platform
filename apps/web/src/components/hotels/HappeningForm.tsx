"use client";

import { useActionState, useEffect, useRef, useState } from "react";

export interface HappeningFormDefaults {
  title?: string;
  description?: string;
  flyerUrl?: string;
  startsAt?: string; // ISO string
  endsAt?: string;
  published?: boolean;
}

interface Props {
  action: (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;
  defaults?: HappeningFormDefaults;
  submitLabel?: string;
  onSuccess: () => void;
  onCancel: () => void;
}

export function HappeningForm({ action, defaults = {}, submitLabel = "Save", onSuccess, onCancel }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);

  useEffect(() => {
    if (state && !state.error) onSuccess();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  // Flyer upload state — same pattern as EventForm's photo upload.
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedUrl, setUploadedUrl] = useState<string>("");
  const [uploadError, setUploadError] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);
  const [previewSrc, setPreviewSrc] = useState<string>(defaults.flyerUrl ?? "");

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
        setPreviewSrc(defaults.flyerUrl ?? "");
      } else {
        setUploadedUrl(json.url);
      }
    } catch {
      setUploadError("Upload failed — please try again");
      setUploadedUrl("");
      setPreviewSrc(defaults.flyerUrl ?? "");
    } finally {
      setIsUploading(false);
    }
  }

  function handleRemoveFlyer() {
    setUploadedUrl("");
    setPreviewSrc("");
    setUploadError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const effectiveFlyerUrl = uploadedUrl || previewSrc;

  return (
    <form action={formAction} className="space-y-5">
      {state?.error && (
        <div className="rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          Title <span className="text-red-500">*</span>
        </label>
        <input
          name="title"
          type="text"
          required
          defaultValue={defaults.title ?? ""}
          placeholder="e.g. Sunday Jazz Brunch"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
        <textarea
          name="description"
          rows={3}
          defaultValue={defaults.description ?? ""}
          placeholder="What's on, who it's for, anything a guest should know…"
          className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent resize-none"
        />
      </div>

      {/* Flyer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Flyer</label>

        {previewSrc && !uploadError && (
          <div className="relative mb-3 w-full h-44 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={previewSrc} alt="Flyer preview" className="w-full h-full object-cover" />
            <button
              type="button"
              onClick={handleRemoveFlyer}
              className="absolute top-2 right-2 bg-white/80 hover:bg-white text-gray-700 rounded-full p-1 shadow transition"
              title="Remove flyer"
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
              {isUploading ? "Uploading…" : previewSrc && !uploadError ? "Replace flyer" : "Upload a flyer"}
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

        <input type="hidden" name="flyerUrl" value={effectiveFlyerUrl} />
      </div>

      {/* Dates */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Starts</label>
          <input
            name="startsAt"
            type="datetime-local"
            defaultValue={defaults.startsAt ? toDatetimeLocal(defaults.startsAt) : ""}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
          <p className="text-xs text-gray-400 mt-1">Optional — leave blank for an ongoing/recurring happening.</p>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Ends</label>
          <input
            name="endsAt"
            type="datetime-local"
            defaultValue={defaults.endsAt ? toDatetimeLocal(defaults.endsAt) : ""}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent"
          />
        </div>
      </div>

      {/* Published */}
      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          type="checkbox"
          name="published"
          defaultChecked={defaults.published ?? true}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-400"
        />
        Visible on the hotel's public page
      </label>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="border border-gray-200 text-gray-700 px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 transition"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/** Convert an ISO date string to the value needed by datetime-local inputs. */
function toDatetimeLocal(iso: string): string {
  try {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  } catch {
    return "";
  }
}

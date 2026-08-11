"use client";

import { useActionState, useEffect, useRef } from "react";
import { MENU_CATEGORY_ORDER } from "@/types/restaurants";

export interface MenuItemDefaults {
  name: string;
  description: string;
  price: string;
  category: string;
  imageUrl: string;
  available: boolean;
  sortOrder: string;
}

interface Props {
  action: (
    prev: { error?: string; success?: boolean } | null,
    data: FormData,
  ) => Promise<{ error?: string; success?: boolean }>;
  submitLabel: string;
  defaults?: MenuItemDefaults;
  onDone?: () => void;
  resetOnSuccess?: boolean;
}

const inputCls =
  "w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent";

export function MenuItemForm({ action, submitLabel, defaults, onDone, resetOnSuccess }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) {
      if (resetOnSuccess) formRef.current?.reset();
      onDone?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form ref={formRef} action={formAction} className="space-y-4">
      {state?.error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Item name <span className="text-red-500">*</span>
          </label>
          <input name="name" required defaultValue={defaults?.name ?? ""} className={inputCls} placeholder="e.g. Nyama Choma Platter" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Category <span className="text-red-500">*</span>
          </label>
          <input
            name="category"
            required
            defaultValue={defaults?.category ?? ""}
            className={inputCls}
            placeholder="e.g. Mains"
            list="menu-categories"
          />
          <datalist id="menu-categories">
            {MENU_CATEGORY_ORDER.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 mb-1">Description</label>
        <textarea
          name="description"
          rows={2}
          defaultValue={defaults?.description ?? ""}
          className={inputCls}
          placeholder="Short description shown on the menu"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            Price (KES) <span className="text-red-500">*</span>
          </label>
          <input
            name="price"
            type="number"
            min="0"
            step="0.01"
            required
            defaultValue={defaults?.price ?? ""}
            className={inputCls}
            placeholder="0.00"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Sort order</label>
          <input
            name="sortOrder"
            type="number"
            step="1"
            defaultValue={defaults?.sortOrder ?? "0"}
            className={inputCls}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">Image URL</label>
          <input
            name="imageUrl"
            defaultValue={defaults?.imageUrl ?? ""}
            className={inputCls}
            placeholder="https://images.unsplash.com/…"
            title="Must be an https link from images.unsplash.com, plus.unsplash.com, or lh3.googleusercontent.com"
          />
        </div>
      </div>

      <label className="flex items-center gap-2 text-sm text-gray-700">
        <input
          name="available"
          type="checkbox"
          defaultChecked={defaults?.available ?? true}
          className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
        />
        Available (shown on the public menu)
      </label>

      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {isPending ? "Saving…" : submitLabel}
        </button>
        {onDone && (
          <button
            type="button"
            onClick={onDone}
            className="text-sm text-gray-500 hover:text-gray-700 px-3 py-2"
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";

interface Discount {
  id: string;
  code: string;
  type: "PERCENTAGE" | "FIXED_AMOUNT";
  value: number;
  maxUses: number | null;
  usedCount: number;
  expiresAt: string | null;
  isActive: boolean;
}

type DiscountAction = (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;

interface Props {
  discounts: Discount[];
  createAction: DiscountAction;
  updateActions: Record<string, DiscountAction>;
  deleteAction: (discountId: string) => Promise<{ error?: string }>;
}

function DiscountForm({
  action, defaults, submitLabel, onCancel,
}: {
  action: DiscountAction;
  defaults?: Partial<{ code: string; type: string; value: string; maxUses: string; expiresAt: string; isActive: boolean }>;
  submitLabel: string;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const router = useRouter();

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await action(null, new FormData(e.currentTarget));
    setPending(false);
    if (result?.error) setError(result.error);
    else { router.refresh(); onCancel(); }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      {error && <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-3 py-2">{error}</div>}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Code *</label>
          <input name="code" required defaultValue={defaults?.code ?? ""} placeholder="EARLYBIRD10"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Type</label>
          <select name="type" defaultValue={defaults?.type ?? "PERCENTAGE"}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-orange-500">
            <option value="PERCENTAGE">Percentage off</option>
            <option value="FIXED_AMOUNT">Fixed amount off</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Value *</label>
          <input name="value" type="number" min="0.01" step="0.01" required defaultValue={defaults?.value ?? ""} placeholder="e.g. 10"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Max uses <span className="text-gray-400 font-normal">(blank = unlimited)</span></label>
          <input name="maxUses" type="number" min="1" defaultValue={defaults?.maxUses ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Expires</label>
          <input name="expiresAt" type="datetime-local" defaultValue={defaults?.expiresAt ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} className="w-4 h-4 accent-orange-600" />
            Active
          </label>
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button type="submit" disabled={pending} className="bg-orange-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-orange-700 disabled:opacity-50 transition">
          {pending ? "Saving…" : submitLabel}
        </button>
        <button type="button" onClick={onCancel} className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition">
          Cancel
        </button>
      </div>
    </form>
  );
}

export function DiscountsManager({ discounts, createAction, updateActions, deleteAction }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(async (id: string, code: string) => {
    if (!confirm(`Delete code "${code}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await deleteAction(id);
    router.refresh();
    setDeletingId(null);
  }, [deleteAction, router]);

  function toDatetimeLocal(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  return (
    <div className="space-y-4">
      {!showAdd && (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
          <span className="text-lg leading-none">+</span> Add promo code
        </button>
      )}
      {showAdd && (
        <div className="bg-surface rounded-2xl border border-orange-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New promo code</h3>
          <DiscountForm action={createAction} submitLabel="Add code" onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {discounts.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400 bg-surface rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
          No promo codes for this event yet.
        </p>
      ) : (
        <div className="space-y-3">
          {discounts.map((d) => (
            <div key={d.id} className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
              {editingId === d.id ? (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Edit code</h3>
                  <DiscountForm
                    action={updateActions[d.id]}
                    defaults={{
                      code: d.code, type: d.type, value: String(d.value),
                      maxUses: d.maxUses ? String(d.maxUses) : "",
                      expiresAt: d.expiresAt ? toDatetimeLocal(d.expiresAt) : "",
                      isActive: d.isActive,
                    }}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-mono font-medium text-gray-900">{d.code}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${d.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {d.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {d.type === "PERCENTAGE" ? `${d.value}% off` : `KES ${d.value} off`}
                      {" · "}{d.usedCount}{d.maxUses ? `/${d.maxUses}` : ""} used
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditingId(d.id)} className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition">Edit</button>
                    <button onClick={() => handleDelete(d.id, d.code)} disabled={deletingId === d.id} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                      {deletingId === d.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

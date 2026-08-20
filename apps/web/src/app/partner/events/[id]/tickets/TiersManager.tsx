"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { formatCurrency } from "@/lib/format";

interface Tier {
  id: string;
  name: string;
  price: number;
  currency: string;
  capacity: number;
  sold: number;
  salesStart: string | null;
  salesEnd: string | null;
  isActive: boolean;
}

type TierAction = (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;

interface Props {
  tiers: Tier[];
  createAction: TierAction;
  updateActions: Record<string, TierAction>;
  deleteAction: (tierId: string) => Promise<{ error?: string }>;
}

function toDatetimeLocal(iso: string): string {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function TierForm({
  action, defaults, submitLabel, onCancel,
}: {
  action: TierAction;
  defaults?: Partial<{ name: string; price: string; currency: string; capacity: string; salesStart: string; salesEnd: string; isActive: boolean }>;
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
        <div className="col-span-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Tier name *</label>
          <input name="name" required defaultValue={defaults?.name ?? ""} placeholder="e.g. Early Bird"
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Price *</label>
          <input name="price" type="number" min="0" step="0.01" required defaultValue={defaults?.price ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
          <select name="currency" defaultValue={defaults?.currency ?? "KES"}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-surface focus:outline-none focus:ring-2 focus:ring-orange-500">
            {["KES", "USD", "EUR", "GBP"].map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Capacity *</label>
          <input name="capacity" type="number" min="1" required defaultValue={defaults?.capacity ?? "50"}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div className="flex items-end pb-1.5">
          <label className="flex items-center gap-2 text-sm text-gray-700">
            <input type="checkbox" name="isActive" defaultChecked={defaults?.isActive ?? true} className="w-4 h-4 accent-orange-600" />
            On sale
          </label>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sales start</label>
          <input name="salesStart" type="datetime-local" defaultValue={defaults?.salesStart ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Sales end</label>
          <input name="salesEnd" type="datetime-local" defaultValue={defaults?.salesEnd ?? ""}
            className="w-full border border-gray-200 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500" />
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

export function TiersManager({ tiers, createAction, updateActions, deleteAction }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = useCallback(async (id: string, name: string) => {
    if (!confirm(`Delete tier "${name}"? This cannot be undone.`)) return;
    setDeletingId(id);
    await deleteAction(id);
    router.refresh();
    setDeletingId(null);
  }, [deleteAction, router]);

  return (
    <div className="space-y-4">
      {!showAdd && (
        <button onClick={() => setShowAdd(true)} className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition">
          <span className="text-lg leading-none">+</span> Add tier
        </button>
      )}
      {showAdd && (
        <div className="bg-surface rounded-2xl border border-orange-200 p-5">
          <h3 className="text-sm font-semibold text-gray-900 mb-3">New tier</h3>
          <TierForm action={createAction} submitLabel="Add tier" onCancel={() => setShowAdd(false)} />
        </div>
      )}

      {tiers.length === 0 && !showAdd ? (
        <p className="text-sm text-gray-400 bg-surface rounded-xl border border-dashed border-gray-200 px-5 py-6 text-center">
          No tiers yet — the event's flat price applies until you add one.
        </p>
      ) : (
        <div className="space-y-3">
          {tiers.map((t) => (
            <div key={t.id} className="bg-surface rounded-xl border border-gray-200 overflow-hidden">
              {editingId === t.id ? (
                <div className="p-4">
                  <h3 className="text-sm font-semibold text-gray-900 mb-3">Edit tier</h3>
                  <TierForm
                    action={updateActions[t.id]}
                    defaults={{
                      name: t.name, price: String(t.price), currency: t.currency, capacity: String(t.capacity),
                      salesStart: t.salesStart ? toDatetimeLocal(t.salesStart) : "",
                      salesEnd: t.salesEnd ? toDatetimeLocal(t.salesEnd) : "",
                      isActive: t.isActive,
                    }}
                    submitLabel="Save changes"
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{t.name}</p>
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${t.isActive ? "bg-green-50 text-green-700 border-green-200" : "bg-gray-50 text-gray-500 border-gray-200"}`}>
                        {t.isActive ? "On sale" : "Off sale"}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatCurrency(t.price, t.currency)} · {t.sold}/{t.capacity} sold
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => setEditingId(t.id)} className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition">Edit</button>
                    <button onClick={() => handleDelete(t.id, t.name)} disabled={deletingId === t.id} className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50">
                      {deletingId === t.id ? "Deleting…" : "Delete"}
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

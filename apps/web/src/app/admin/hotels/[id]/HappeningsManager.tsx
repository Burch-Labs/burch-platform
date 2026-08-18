"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { HappeningForm } from "./HappeningForm";

interface Happening {
  id: string;
  title: string;
  description: string | null;
  flyerUrl: string | null;
  startsAt: string | null;
  endsAt: string | null;
  published: boolean;
}

type HappeningAction = (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;

interface Props {
  happenings: Happening[];
  createAction: HappeningAction;
  updateActions: Record<string, HappeningAction>;
  deleteAction: (happeningId: string) => Promise<{ error?: string }>;
}

function formatRange(startsAt: string | null, endsAt: string | null): string | null {
  if (!startsAt && !endsAt) return null;
  const fmt = (iso: string) =>
    new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
  if (startsAt && endsAt) return `${fmt(startsAt)} – ${fmt(endsAt)}`;
  return fmt((startsAt ?? endsAt) as string);
}

export function HappeningsManager({ happenings, createAction, updateActions, deleteAction }: Props) {
  const router = useRouter();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleAddSuccess = useCallback(() => {
    setShowAddForm(false);
    router.refresh();
  }, [router]);

  const handleEditSuccess = useCallback(() => {
    setEditingId(null);
    router.refresh();
  }, [router]);

  async function handleDelete(happeningId: string) {
    setDeletingId(happeningId);
    setDeleteError(null);
    const result = await deleteAction(happeningId);
    if (result?.error) {
      setDeleteError(result.error);
      setDeletingId(null);
    } else {
      router.refresh();
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
        >
          <span className="text-lg leading-none">+</span>
          Add happening
        </button>
      )}

      {showAddForm && (
        <div className="bg-white rounded-2xl border border-orange-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New happening</h2>
          <HappeningForm
            action={createAction}
            submitLabel="Add happening"
            onSuccess={handleAddSuccess}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      {deleteError && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3">
          {deleteError}
        </div>
      )}

      {happenings.length === 0 && !showAddForm ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-8 py-14 text-center">
          <p className="text-4xl mb-4">✨</p>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No happenings yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Add a flyer and a few lines about what's on at this hotel's restaurant right now.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
          >
            Add happening
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {happenings.map((happening) => (
            <div key={happening.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {editingId === happening.id ? (
                <div className="p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Edit happening</h3>
                  <HappeningForm
                    action={updateActions[happening.id]}
                    defaults={{
                      title: happening.title,
                      description: happening.description ?? "",
                      flyerUrl: happening.flyerUrl ?? "",
                      startsAt: happening.startsAt ?? "",
                      endsAt: happening.endsAt ?? "",
                      published: happening.published,
                    }}
                    submitLabel="Save changes"
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                <div className="flex items-start justify-between gap-4 px-6 py-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {happening.flyerUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={happening.flyerUrl}
                        alt={happening.title}
                        className="w-16 h-16 rounded-lg object-cover flex-shrink-0 border border-gray-100"
                      />
                    )}
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-gray-900">{happening.title}</p>
                        <span
                          className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                            happening.published
                              ? "bg-green-50 text-green-700 border-green-200"
                              : "bg-gray-50 text-gray-500 border-gray-200"
                          }`}
                        >
                          {happening.published ? "Visible" : "Hidden"}
                        </span>
                      </div>
                      {formatRange(happening.startsAt, happening.endsAt) && (
                        <p className="text-sm text-gray-500 mt-0.5">
                          {formatRange(happening.startsAt, happening.endsAt)}
                        </p>
                      )}
                      {happening.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{happening.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setEditingId(happening.id)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${happening.title}"? This cannot be undone.`)) {
                          handleDelete(happening.id);
                        }
                      }}
                      disabled={deletingId === happening.id}
                      className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deletingId === happening.id ? "Deleting…" : "Delete"}
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

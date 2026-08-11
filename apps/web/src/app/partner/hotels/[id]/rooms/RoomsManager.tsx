"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { RoomForm } from "./RoomForm";

interface Room {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  price: number;
  currency: string;
  capacity: number;
  maxGuests: number;
  bedType: string | null;
  amenities: string[];
  quantity: number;
  available: boolean;
}

type RoomAction = (prev: { error?: string } | null, data: FormData) => Promise<{ error?: string }>;

interface Props {
  rooms: Room[];
  createAction: RoomAction;
  updateActions: Record<string, RoomAction>;
  deleteAction: (roomId: string) => Promise<{ error?: string }>;
}

export function RoomsManager({ rooms, createAction, updateActions, deleteAction }: Props) {
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

  async function handleDelete(roomId: string) {
    setDeletingId(roomId);
    setDeleteError(null);
    const result = await deleteAction(roomId);
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
      {/* Add room toggle */}
      {!showAddForm && (
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 bg-orange-600 text-white px-4 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
        >
          <span className="text-lg leading-none">+</span>
          Add room
        </button>
      )}

      {/* Add room form */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-orange-200 p-6">
          <h2 className="text-base font-semibold text-gray-900 mb-4">New room</h2>
          <RoomForm
            action={createAction}
            submitLabel="Add room"
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

      {/* Room list */}
      {rooms.length === 0 && !showAddForm ? (
        <div className="bg-white rounded-2xl border border-dashed border-gray-200 px-8 py-14 text-center">
          <p className="text-4xl mb-4">🛏️</p>
          <h3 className="text-base font-semibold text-gray-900 mb-2">No rooms yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-xs mx-auto">
            Add your first room type so guests can see pricing and availability.
          </p>
          <button
            onClick={() => setShowAddForm(true)}
            className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
          >
            Add room
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {rooms.map((room) => (
            <div key={room.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              {editingId === room.id ? (
                /* ── Inline edit form ── */
                <div className="p-6">
                  <h3 className="text-base font-semibold text-gray-900 mb-4">Edit room</h3>
                  <RoomForm
                    action={updateActions[room.id]}
                    defaults={{
                      name:        room.name,
                      description: room.description ?? "",
                      imageUrl:    room.imageUrl ?? "",
                      price:       String(room.price),
                      currency:    room.currency,
                      capacity:    String(room.capacity),
                      maxGuests:   String(room.maxGuests),
                      bedType:     room.bedType ?? "",
                      amenities:   room.amenities.join(", "),
                      quantity:    String(room.quantity),
                      available:   room.available,
                    }}
                    submitLabel="Save changes"
                    onSuccess={handleEditSuccess}
                    onCancel={() => setEditingId(null)}
                  />
                </div>
              ) : (
                /* ── Room summary row ── */
                <div className="flex items-start justify-between px-6 py-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-gray-900">{room.name}</p>
                      {room.bedType && (
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                          {room.bedType}
                        </span>
                      )}
                      <span
                        className={`text-xs font-medium px-2 py-0.5 rounded-full border ${
                          room.available
                            ? "bg-green-50 text-green-700 border-green-200"
                            : "bg-gray-50 text-gray-500 border-gray-200"
                        }`}
                      >
                        {room.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1">
                      <p className="text-sm font-semibold text-orange-600">
                        {room.currency} {Number(room.price).toLocaleString()}{" "}
                        <span className="text-gray-400 font-normal">/ night</span>
                      </p>
                      <p className="text-sm text-gray-500">
                        {room.quantity} room{room.quantity !== 1 ? "s" : ""} · max {room.maxGuests} guest{room.maxGuests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {room.description && (
                      <p className="text-xs text-gray-400 mt-1 line-clamp-1">{room.description}</p>
                    )}
                    {room.amenities.length > 0 && (
                      <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">
                        {room.amenities.join(" · ")}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 ml-4 shrink-0">
                    <button
                      onClick={() => setEditingId(room.id)}
                      className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${room.name}"? This cannot be undone.`)) {
                          handleDelete(room.id);
                        }
                      }}
                      disabled={deletingId === room.id}
                      className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    >
                      {deletingId === room.id ? "Deleting…" : "Delete"}
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

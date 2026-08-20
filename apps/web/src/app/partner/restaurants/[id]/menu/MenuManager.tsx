"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createMenuItem, updateMenuItem, deleteMenuItem } from "./actions";
import { MenuItemForm } from "./MenuItemForm";
import { formatCurrency } from "@/lib/format";
import { MENU_CATEGORY_ORDER } from "@/types/restaurants";

export interface MenuItemView {
  id: string;
  name: string;
  description: string | null;
  price: string; // decimal serialized as string
  currency: string;
  category: string;
  imageUrl: string | null;
  available: boolean;
  sortOrder: number;
}

interface Props {
  restaurantId: string;
  items: MenuItemView[];
}

function sortCategories(cats: string[]): string[] {
  return [...cats].sort((a, b) => {
    const ai = MENU_CATEGORY_ORDER.indexOf(a);
    const bi = MENU_CATEGORY_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function MenuManager({ restaurantId, items }: Props) {
  const router = useRouter();
  const [showAdd, setShowAdd] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const grouped = items.reduce<Record<string, MenuItemView[]>>((acc, item) => {
    (acc[item.category] ??= []).push(item);
    return acc;
  }, {});
  const categories = sortCategories(Object.keys(grouped));

  const boundCreate = createMenuItem.bind(null, restaurantId);

  return (
    <div className="space-y-6">
      {/* Add item */}
      <div className="bg-surface rounded-2xl border border-gray-200 p-6">
        {showAdd ? (
          <>
            <h2 className="text-base font-semibold text-gray-900 mb-4">Add menu item</h2>
            <MenuItemForm
              action={boundCreate}
              submitLabel="Add item"
              resetOnSuccess
              onDone={() => {
                setShowAdd(false);
                router.refresh();
              }}
            />
          </>
        ) : (
          <button
            onClick={() => setShowAdd(true)}
            className="w-full text-sm font-semibold text-orange-600 hover:text-orange-700 py-2 rounded-xl border border-dashed border-orange-200 hover:bg-orange-50 transition"
          >
            + Add menu item
          </button>
        )}
      </div>

      {/* Items */}
      {items.length === 0 ? (
        <div className="bg-surface rounded-2xl border border-dashed border-gray-200 px-8 py-12 text-center">
          <p className="text-4xl mb-3">📋</p>
          <h2 className="text-base font-semibold text-gray-900 mb-1">No menu items yet</h2>
          <p className="text-sm text-gray-500 max-w-xs mx-auto">
            Add your first dish above — items marked available show on your restaurant&apos;s public page.
          </p>
        </div>
      ) : (
        categories.map((category) => (
          <div key={category} className="bg-surface rounded-2xl border border-gray-200 overflow-hidden">
            <h3 className="text-sm font-semibold text-gray-900 px-6 pt-4 pb-3 border-b border-gray-100">
              {category}
              <span className="ml-2 text-xs font-normal text-gray-400">
                {grouped[category].length} item{grouped[category].length !== 1 ? "s" : ""}
              </span>
            </h3>
            <div className="divide-y divide-gray-100">
              {grouped[category].map((item) =>
                editingId === item.id ? (
                  <div key={item.id} className="px-6 py-5 bg-orange-50/40">
                    <h4 className="text-sm font-semibold text-gray-900 mb-3">Edit “{item.name}”</h4>
                    <MenuItemForm
                      action={updateMenuItem.bind(null, restaurantId, item.id)}
                      submitLabel="Save changes"
                      defaults={{
                        name: item.name,
                        description: item.description ?? "",
                        price: item.price,
                        category: item.category,
                        imageUrl: item.imageUrl ?? "",
                        available: item.available,
                        sortOrder: String(item.sortOrder),
                      }}
                      onDone={() => {
                        setEditingId(null);
                        router.refresh();
                      }}
                    />
                  </div>
                ) : (
                  <MenuItemRow
                    key={item.id}
                    restaurantId={restaurantId}
                    item={item}
                    onEdit={() => {
                      setShowAdd(false);
                      setEditingId(item.id);
                    }}
                  />
                ),
              )}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function MenuItemRow({
  restaurantId,
  item,
  onEdit,
}: {
  restaurantId: string;
  item: MenuItemView;
  onEdit: () => void;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleDelete() {
    if (!confirm(`Delete "${item.name}" from the menu? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteMenuItem(restaurantId, item.id);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <div className="flex items-center justify-between px-6 py-3 hover:bg-gray-50 transition">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
          {!item.available && (
            <span className="shrink-0 inline-block text-xs font-medium px-2 py-0.5 rounded-full border bg-gray-50 text-gray-500 border-gray-200">
              Hidden
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-0.5 truncate">
          {formatCurrency(item.price, item.currency)}
          {item.description ? ` · ${item.description}` : ""}
        </p>
      </div>
      <div className="flex items-center gap-2 ml-4 shrink-0">
        <button
          onClick={onEdit}
          className="text-sm text-orange-600 hover:text-orange-700 font-medium px-3 py-1.5 rounded-lg hover:bg-orange-50 transition"
        >
          Edit
        </button>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
        >
          {isPending ? "Deleting…" : "Delete"}
        </button>
      </div>
    </div>
  );
}

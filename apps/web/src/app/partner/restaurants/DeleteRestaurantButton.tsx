"use client";

import { useTransition } from "react";
import { deleteRestaurant } from "./actions";
import { useRouter } from "next/navigation";

interface Props {
  restaurantId: string;
  restaurantName: string;
}

export function DeleteRestaurantButton({ restaurantId, restaurantName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${restaurantName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteRestaurant(restaurantId);
      if (result.error) {
        alert(result.error);
      } else {
        router.refresh();
      }
    });
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="text-sm text-red-500 hover:text-red-700 font-medium px-3 py-1.5 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
    >
      {isPending ? "Deleting…" : "Delete"}
    </button>
  );
}

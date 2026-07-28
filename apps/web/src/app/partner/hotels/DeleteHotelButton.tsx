"use client";

import { useTransition } from "react";
import { deleteHotel } from "./actions";
import { useRouter } from "next/navigation";

interface Props {
  hotelId: string;
  hotelName: string;
}

export function DeleteHotelButton({ hotelId, hotelName }: Props) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleDelete() {
    if (!confirm(`Delete "${hotelName}"? This cannot be undone.`)) return;
    startTransition(async () => {
      const result = await deleteHotel(hotelId);
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

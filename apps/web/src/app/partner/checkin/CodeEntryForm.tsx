"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CodeEntryForm() {
  const router = useRouter();
  const [code, setCode] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = code.trim().toUpperCase();
    if (trimmed) router.push(`/checkin/${trimmed}`);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={code}
        onChange={(e) => setCode(e.target.value)}
        placeholder="e.g. K7M2P9QX"
        maxLength={8}
        autoCapitalize="characters"
        className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-lg tracking-widest font-mono uppercase text-center focus:outline-none focus:ring-2 focus:ring-orange-200"
      />
      <button
        type="submit"
        disabled={!code.trim()}
        className="bg-orange-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        Go
      </button>
    </form>
  );
}

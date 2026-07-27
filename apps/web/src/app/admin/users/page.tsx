"use client";

import { useEffect, useState } from "react";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";

interface User {
  id: string;
  name: string | null;
  email: string;
  role: string;
  emailVerified: string | null;
  createdAt: string;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [unverifiedOnly, setUnverifiedOnly] = useState(false);
  const [busy, setBusy] = useState<Record<string, boolean>>({});
  const [messages, setMessages] = useState<Record<string, { text: string; ok: boolean }>>({});

  async function fetchUsers() {
    setLoading(true);
    const res = await fetch(`/api/admin/users${unverifiedOnly ? "?unverified=1" : ""}`);
    if (res.ok) {
      const data = await res.json();
      setUsers(data.users);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unverifiedOnly]);

  async function handleVerify(id: string) {
    setBusy((b) => ({ ...b, [id]: true }));
    const res = await fetch(`/api/admin/users/${id}/verify`, { method: "POST" });
    const data = await res.json();
    setMessages((m) => ({ ...m, [id]: { text: data.message ?? data.error, ok: res.ok } }));
    setBusy((b) => ({ ...b, [id]: false }));
    if (res.ok) fetchUsers();
  }

  async function handleResend(id: string) {
    setBusy((b) => ({ ...b, [id]: true }));
    const res = await fetch(`/api/admin/users/${id}/resend-verification`, { method: "POST" });
    const data = await res.json();
    setMessages((m) => ({ ...m, [id]: { text: data.message ?? data.error, ok: res.ok } }));
    setBusy((b) => ({ ...b, [id]: false }));
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
            <p className="text-sm text-gray-500 mt-1">Verify accounts and resend confirmation emails</p>
          </div>
          <Link href="/admin" className="text-sm text-gray-500 hover:text-gray-700">
            ← Admin panel
          </Link>
        </div>

        {/* Filter */}
        <div className="flex items-center gap-3 mb-6">
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={unverifiedOnly}
              onChange={(e) => setUnverifiedOnly(e.target.checked)}
              className="rounded border-gray-300 text-orange-500 focus:ring-orange-400"
            />
            Show unverified only
          </label>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Users</h2>
            <span className="text-xs text-gray-400">{users.length} shown</span>
          </div>

          {loading ? (
            <p className="px-6 py-10 text-sm text-gray-400 text-center">Loading…</p>
          ) : users.length === 0 ? (
            <p className="px-6 py-10 text-sm text-gray-400 text-center">No users found.</p>
          ) : (
            <div className="divide-y divide-gray-50">
              {users.map((user) => (
                <div key={user.id} className="px-6 py-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{user.name ?? "—"}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Joined {formatDate(user.createdAt)}</p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {user.emailVerified ? (
                        <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          Verified
                        </span>
                      ) : (
                        <>
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            Unverified
                          </span>
                          <button
                            onClick={() => handleResend(user.id)}
                            disabled={busy[user.id]}
                            className="text-xs px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 disabled:opacity-50"
                          >
                            Resend email
                          </button>
                          <button
                            onClick={() => handleVerify(user.id)}
                            disabled={busy[user.id]}
                            className="text-xs px-3 py-1 rounded-lg bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50"
                          >
                            Verify now
                          </button>
                        </>
                      )}
                      <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                        {user.role}
                      </span>
                    </div>
                  </div>

                  {messages[user.id] && (
                    <p
                      className={`mt-2 text-xs ${
                        messages[user.id].ok ? "text-green-600" : "text-red-500"
                      }`}
                    >
                      {messages[user.id].text}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

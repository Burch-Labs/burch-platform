"use client";

import { useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

function ResetPasswordForm() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  if (!token) {
    return (
      <AuthCard title="Invalid link" subtitle="This password reset link is missing or malformed.">
        <Link
          href="/auth/forgot-password"
          className="block text-center text-sm text-orange-600 font-medium hover:underline"
        >
          Request a new reset link
        </Link>
      </AuthCard>
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token, password }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
    } else {
      setDone(true);
      setTimeout(() => router.push("/auth/login"), 2000);
    }
  }

  if (done) {
    return (
      <AuthCard title="Password updated" subtitle="Your password has been changed successfully.">
        <div className="rounded-xl bg-green-50 border border-green-200 p-5 text-center mb-5">
          <p className="text-3xl mb-2">✓</p>
          <p className="text-sm text-gray-600">Redirecting you to sign in…</p>
        </div>
        <Link
          href="/auth/login"
          className="block text-center text-sm text-orange-600 font-medium hover:underline"
        >
          Sign in now
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard title="Set new password" subtitle="Choose a strong password for your account.">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">New password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            placeholder="Min. 8 characters"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Confirm password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            placeholder="Re-enter password"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "Updating…" : "Update password"}
        </button>
      </form>
    </AuthCard>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

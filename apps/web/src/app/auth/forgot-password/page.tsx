"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/forgot-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });

    setLoading(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Something went wrong.");
    } else {
      setDone(true);
    }
  }

  if (done) {
    return (
      <AuthCard title="Check your inbox" subtitle={`Reset instructions sent to ${email}`}>
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-5 text-center mb-6">
          <p className="text-3xl mb-2">📬</p>
          <p className="text-sm text-gray-600">
            If an account exists for that email, you&apos;ll receive a reset link within a few minutes.
            Check your spam folder if you don&apos;t see it.
          </p>
        </div>
        <Link
          href="/auth/login"
          className="block text-center text-sm text-orange-600 font-medium hover:underline"
        >
          ← Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            placeholder="you@example.com"
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
          {loading ? "Sending…" : "Send reset link"}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Remembered it?{" "}
        <Link href="/auth/login" className="text-orange-600 font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

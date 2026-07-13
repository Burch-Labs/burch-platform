"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

type Role = "CUSTOMER" | "PARTNER";

const ROLES: { value: Role; label: string; description: string; emoji: string }[] = [
  {
    value: "CUSTOMER",
    label: "Customer",
    description: "Browse and book experiences",
    emoji: "🌍",
  },
  {
    value: "PARTNER",
    label: "Partner",
    description: "List events, hotels & restaurants",
    emoji: "🏢",
  },
];

export default function RegisterPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<Role>("CUSTOMER");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingVerification, setPendingVerification] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      return;
    }

    if (data.autoVerified) {
      // Email service not configured — user is already verified, go to login
      router.push("/auth/login?registered=1");
    } else {
      // Email verification required
      setPendingVerification(true);
    }
  }

  if (pendingVerification) {
    return (
      <AuthCard
        title="Check your inbox"
        subtitle={`We sent a verification link to ${email}`}
      >
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-5 text-center mb-6">
          <p className="text-3xl mb-2">📧</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Click the link in your email to activate your account. Check your
            spam folder if you don&apos;t see it within a few minutes.
          </p>
        </div>
        <button
          onClick={async () => {
            await fetch("/api/auth/resend-verification", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email }),
            });
          }}
          className="w-full border border-gray-200 text-gray-600 py-2.5 rounded-lg text-sm font-medium hover:bg-gray-50 transition mb-4"
        >
          Resend verification email
        </button>
        <p className="text-sm text-gray-500 text-center">
          Already verified?{" "}
          <Link
            href="/auth/login"
            className="text-orange-600 font-medium hover:underline"
          >
            Sign in
          </Link>
        </p>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Create your account"
      subtitle="Join Africa's experience platform"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Role picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            I want to…
          </label>
          <div className="grid grid-cols-2 gap-3">
            {ROLES.map(({ value, label, description, emoji }) => (
              <button
                key={value}
                type="button"
                onClick={() => setRole(value)}
                className={`p-3 rounded-xl border text-left transition ${
                  role === value
                    ? "border-orange-500 bg-orange-50 ring-1 ring-orange-500"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="text-xl block mb-1">{emoji}</span>
                <p className="text-sm font-semibold text-gray-900">{label}</p>
                <p className="text-xs text-gray-500 mt-0.5">{description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Full name
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent transition"
            placeholder="Your name"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
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
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Password
          </label>
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
          {loading ? "Creating account…" : "Create account"}
        </button>

        <p className="text-xs text-gray-400 text-center">
          By creating an account you agree to our terms of service.
        </p>
      </form>

      <p className="text-sm text-gray-500 mt-6 text-center">
        Already have an account?{" "}
        <Link
          href="/auth/login"
          className="text-orange-600 font-medium hover:underline"
        >
          Sign in
        </Link>
      </p>
    </AuthCard>
  );
}

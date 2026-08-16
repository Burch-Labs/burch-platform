"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "details" | "code";

/**
 * Passwordless join and sign-in, in one form.
 *
 * There is no separate register page: a first-time visitor and a returning one
 * type the same thing, and the account is created behind the scenes on the
 * first successful code. Name and phone are asked for once and ignored on
 * return, so a repeat visitor only ever types their email and a code.
 */
export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState(10);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send your code. Try again.");
        return;
      }
      setExpiresInMinutes(data.expiresInMinutes ?? 10);
      setStep("code");
    } catch {
      setError("Could not reach the server. Check your connection.");
    } finally {
      setBusy(false);
    }
  }

  async function submitCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await signIn("signin-code", {
        redirect: false,
        email,
        code,
        name,
        phone,
        callbackUrl,
      });
      if (result?.error) {
        // NextAuth collapses every authorize() rejection into one error, so the
        // wording has to cover a wrong code and an expired one alike.
        setError("That code is not right, or it has expired. Request a new one.");
        return;
      }
      router.push(callbackUrl);
      router.refresh();
    } catch {
      setError("Could not sign you in. Try again.");
    } finally {
      setBusy(false);
    }
  }

  if (step === "code") {
    return (
      <form onSubmit={submitCode} className="space-y-4">
        <div>
          <p className="text-sm text-gray-600">
            We sent a {6}-digit code to <span className="font-medium text-gray-900">{email}</span>.
          </p>
          <p className="text-xs text-gray-400 mt-1">
            It expires in {expiresInMinutes} minutes and works once.
          </p>
        </div>

        <div>
          <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
            Your code
          </label>
          <input
            id="code"
            name="code"
            inputMode="numeric"
            autoComplete="one-time-code"
            autoFocus
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-lg tracking-[0.4em] text-center font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500"
            placeholder="······"
          />
        </div>

        {error && (
          <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || code.length < 6}
          className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
        >
          {busy ? "Checking…" : "Continue"}
        </button>

        <button
          type="button"
          onClick={() => {
            setStep("details");
            setCode("");
            setError(null);
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-900 transition"
        >
          Use a different email
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={requestCode} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
          Your name
        </label>
        <input
          id="name"
          name="name"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="Wanjiru Kamau"
        />
      </div>

      <div>
        <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
          Phone <span className="text-gray-400 font-normal">— for your tickets</span>
        </label>
        <input
          id="phone"
          name="phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="0712 345 678"
        />
      </div>

      <div>
        <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="you@example.com"
        />
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !email}
        className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send me a code"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        No password needed. We email you a code each time you sign in.
      </p>
    </form>
  );
}

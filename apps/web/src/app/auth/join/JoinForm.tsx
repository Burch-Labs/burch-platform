"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type Step = "details" | "code";
type Channel = "email" | "sms" | "whatsapp";

const CHANNEL_LABEL: Record<Channel, string> = {
  email: "Email",
  sms: "SMS",
  whatsapp: "WhatsApp",
};

const CHANNEL_SENT: Record<Channel, string> = {
  email: "We emailed a 6-digit code to",
  sms: "We texted a 6-digit code to",
  whatsapp: "We sent a 6-digit code on WhatsApp to",
};

/** Looks like a phone rather than an email. Good enough to choose a keyboard. */
function looksLikePhone(value: string): boolean {
  return value.trim().length > 0 && !value.includes("@");
}

/**
 * Passwordless join and sign-in, in one form.
 *
 * One field takes either an email address or a phone number, because people
 * know which of their own contact details they are typing and a pair of radio
 * buttons asking them to declare it first is friction for nothing.
 *
 * The channel picker only appears for a phone, and only lists channels the
 * server says are actually configured — offering WhatsApp when it is not set
 * up would send someone to wait for a message that never arrives.
 */
export function JoinForm() {
  const router = useRouter();
  const params = useSearchParams();
  const callbackUrl = params.get("callbackUrl") ?? "/";

  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [identifier, setIdentifier] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [expiresInMinutes, setExpiresInMinutes] = useState(10);
  const [channel, setChannel] = useState<Channel>("email");
  const [preferred, setPreferred] = useState<Channel | null>(null);
  const [available, setAvailable] = useState<Channel[]>([]);

  const isPhone = looksLikePhone(identifier);

  async function requestCode(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier, channel: preferred ?? undefined }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Could not send your code. Try again.");
        return;
      }
      setExpiresInMinutes(data.expiresInMinutes ?? 10);
      setChannel(data.channel ?? "email");
      setAvailable(data.availableChannels ?? []);
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
        email: identifier,
        code,
        name,
        callbackUrl,
      });
      if (result?.error) {
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
            {CHANNEL_SENT[channel]}{" "}
            <span className="font-medium text-gray-900">{identifier}</span>.
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

        {available.length > 1 && (
          <p className="text-xs text-gray-400 text-center">
            Didn&apos;t arrive? Go back and try{" "}
            {available.filter((c) => c !== channel).map((c) => CHANNEL_LABEL[c]).join(" or ")}.
          </p>
        )}

        <button
          type="button"
          onClick={() => {
            setStep("details");
            setCode("");
            setError(null);
          }}
          className="w-full text-sm text-gray-500 hover:text-gray-900 transition"
        >
          Use something else
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
        <label htmlFor="identifier" className="block text-sm font-medium text-gray-700 mb-1">
          Phone or email
        </label>
        <input
          id="identifier"
          name="identifier"
          required
          inputMode={isPhone ? "tel" : "email"}
          autoComplete="username"
          value={identifier}
          onChange={(e) => {
            setIdentifier(e.target.value);
            setPreferred(null);
          }}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          placeholder="0712 345 678 or you@example.com"
        />
      </div>

      {/* Channel choice only means something for a phone — an email address has
          exactly one way to reach it. */}
      {isPhone && (
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-1.5">Send my code by</p>
          <div className="flex gap-2">
            {(["whatsapp", "sms"] as const).map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setPreferred(c)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition ${
                  preferred === c
                    ? "border-orange-300 bg-orange-50 text-orange-800"
                    : "border-gray-200 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {CHANNEL_LABEL[c]}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-400 mt-1.5">
            We&apos;ll use whichever is available if your choice isn&apos;t set up yet.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={busy || !identifier.trim()}
        className="w-full bg-orange-600 text-white px-6 py-3 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send me a code"}
      </button>

      <p className="text-xs text-gray-400 text-center">
        No password needed. We send a code each time you sign in.
      </p>
    </form>
  );
}

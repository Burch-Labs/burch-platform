"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";
  const error = params.get("error");

  if (error === "expired") {
    return (
      <AuthCard
        title="Link expired"
        subtitle="This verification link is no longer valid"
      >
        <div className="rounded-xl bg-orange-50 border border-orange-100 p-5 text-center mb-6">
          <p className="text-4xl mb-3">⏰</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Verification links expire after 24 hours. Request a new one and
            click it straight away.
          </p>
        </div>

        <p className="text-sm text-gray-500 mb-4 text-center">
          Need a fresh link?
        </p>

        <Link
          href="/auth/login"
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium transition mb-4"
        >
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  if (error === "invalid") {
    return (
      <AuthCard
        title="Invalid link"
        subtitle="This verification link has already been used or doesn't exist"
      >
        <div className="rounded-xl bg-red-50 border border-red-100 p-5 text-center mb-6">
          <p className="text-4xl mb-3">🔗</p>
          <p className="text-sm text-gray-600 leading-relaxed">
            Each link can only be used once. If your email is not yet verified,
            sign in and we&apos;ll send you a new link.
          </p>
        </div>

        <Link
          href="/auth/login"
          className="block w-full text-center bg-orange-500 hover:bg-orange-600 text-white py-2.5 rounded-lg text-sm font-medium transition mb-4"
        >
          Back to sign in
        </Link>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      subtitle={email ? `We sent a link to ${email}` : "Check your inbox"}
    >
      <div className="rounded-xl bg-orange-50 border border-orange-100 p-5 text-center mb-6">
        <p className="text-4xl mb-3">📧</p>
        <p className="text-sm text-gray-600 leading-relaxed">
          Click the link in your email to verify your account.
          The link expires in 24 hours.
        </p>
      </div>

      <p className="text-sm text-gray-500 mb-4 text-center">Didn&apos;t receive an email?</p>

      {email && (
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
      )}

      <p className="text-sm text-gray-500 text-center">
        <Link href="/auth/login" className="text-orange-600 font-medium hover:underline">
          ← Back to sign in
        </Link>
      </p>
    </AuthCard>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

function VerifyEmailContent() {
  const params = useSearchParams();
  const email = params.get("email") ?? "";

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

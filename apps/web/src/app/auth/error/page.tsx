"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { AuthCard } from "@/components/auth/AuthCard";

const ERROR_MESSAGES: Record<string, string> = {
  OAuthSignin: "There was a problem starting the Google sign-in flow. Please try again.",
  OAuthCallback: "There was a problem during Google sign-in. Please try again.",
  OAuthCreateAccount: "Could not create your account via Google. Please try email sign-up.",
  OAuthAccountNotLinked:
    "An account already exists with this email using a different sign-in method. Please sign in with your original method.",
  EmailSignin: "There was a problem sending the email. Please try again.",
  CredentialsSignin: "Invalid email or password. Please try again.",
  SessionRequired: "Please sign in to access this page.",
  Default: "An unexpected error occurred. Please try again.",
};

function AuthErrorContent() {
  const params = useSearchParams();
  const errorCode = params.get("error") ?? "Default";
  const message = ERROR_MESSAGES[errorCode] ?? ERROR_MESSAGES.Default;

  return (
    <AuthCard title="Sign-in error" subtitle="Something went wrong during authentication">
      <div className="rounded-xl bg-red-50 border border-red-200 p-5 mb-6">
        <p className="text-sm text-red-700">{message}</p>
      </div>

      <Link
        href="/auth/login"
        className="block w-full text-center bg-orange-600 text-white py-2.5 rounded-lg text-sm font-semibold hover:bg-orange-700 transition mb-3"
      >
        Try again
      </Link>

      <Link
        href="/"
        className="block text-center text-sm text-gray-500 hover:text-gray-700"
      >
        Go to homepage
      </Link>
    </AuthCard>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense>
      <AuthErrorContent />
    </Suspense>
  );
}

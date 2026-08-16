import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Sign in — dontbeboring" };

export default function JoinPage() {
  return (
    <AuthCard
      title="Welcome"
      subtitle="Enter your details and we'll email you a code. No password to remember."
    >
      {/* JoinForm reads callbackUrl from the query string, so it needs a
          Suspense boundary under the app router. */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-xl" />}>
        <JoinForm />
      </Suspense>
    </AuthCard>
  );
}

import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { channelsFor } from "@/lib/delivery";
import { JoinForm } from "./JoinForm";

export const metadata = { title: "Sign in — dontbeboringKE" };

// Whether a phone can be signed in with depends on runtime configuration, so
// this page cannot be statically rendered.
export const dynamic = "force-dynamic";

export default function JoinPage() {
  // Ask the same function the API uses rather than keeping a separate flag.
  // Configure WhatsApp or SMS and phone sign-in appears here on its own; leave
  // them unset and the form never offers a route it cannot deliver on. A flag
  // would be one more thing to remember to flip on the day the template clears
  // Meta's review.
  const allowPhone = channelsFor({ kind: "phone", value: "+254700000000" }).length > 0;

  return (
    <AuthCard
      title="Welcome"
      subtitle={
        allowPhone
          ? "Enter your details and we'll send you a code. No password to remember."
          : "Enter your details and we'll email you a code. No password to remember."
      }
    >
      {/* JoinForm reads callbackUrl from the query string, so it needs a
          Suspense boundary under the app router. */}
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-xl" />}>
        <JoinForm allowPhone={allowPhone} />
      </Suspense>
    </AuthCard>
  );
}

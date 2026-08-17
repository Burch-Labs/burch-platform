import { Suspense } from "react";
import { AuthCard } from "@/components/auth/AuthCard";
import { JoinForm } from "@/app/auth/join/JoinForm";

export const metadata = { title: "Admin sign-in — dontbeboring" };

// Same reason as /auth/join: whether phone sign-in is offered depends on
// runtime config, so this can't be statically rendered either.
export const dynamic = "force-dynamic";

/**
 * A separate URL for the same emailed-code sign-in, so admins have a link
 * that isn't buried in the public nav. It doesn't gate who can request a
 * code — anyone can, same as /auth/join — the middleware is what actually
 * keeps non-admins out of /admin once they're signed in.
 */
export default function AdminLoginPage() {
  return (
    <AuthCard
      title="Admin sign-in"
      subtitle="Enter the email on your admin account and we'll send you a code."
    >
      <Suspense fallback={<div className="h-64 animate-pulse bg-gray-50 rounded-xl" />}>
        <JoinForm defaultCallbackUrl="/admin" />
      </Suspense>
    </AuthCard>
  );
}

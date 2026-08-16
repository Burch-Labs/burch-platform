import type { NextConfig } from "next";

// ─── Blank-but-present env vars ──────────────────────────────────────────────
// A dashboard that lets you save an env var with an empty value (rather than
// requiring you to delete the row) makes "present but blank" trivially easy to
// end up with by accident. Our own checks below treat that the same as unset —
// `!process.env.NEXTAUTH_URL` is true either way — but NextAuth's internal
// code is not so careful: given NEXTAUTH_URL="" it calls `new URL("")` and
// crashes prerendering on every page that touches a session, with no message
// pointing at the actual cause. Blanking it out here, before anything else
// loads, means downstream code sees a cleanly unset variable and falls back
// the way it's meant to, instead of the whole build going down over one empty
// dashboard field.
for (const key of ["NEXTAUTH_URL", "DATABASE_URL", "RESEND_API_KEY"]) {
  if (process.env[key] !== undefined && process.env[key]!.trim() === "") {
    delete process.env[key];
  }
}

// ─── Production environment guard ────────────────────────────────────────────
// Fail loudly at build / startup so a misconfigured deployment is immediately
// visible rather than silently broken for end-users.
if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
  throw new Error(
    "[config] RESEND_API_KEY is required in production. " +
      "Email carries the sign-in codes, which are the only way into an account — " +
      "without it nobody can sign in at all, existing users included. " +
      "Set the secret in your deployment environment and redeploy."
  );
}

const nextConfig: NextConfig = {
  // Expose a public flag so client components can conditionally show Google Sign-In.
  // Evaluated at server startup — reflects whether credentials are actually present.
  env: {
    NEXT_PUBLIC_HAS_GOOGLE:
      process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET ? "1" : "0",
  },
  // Allow Replit's proxied preview domain as a dev origin
  allowedDevOrigins: ["*.picard.replit.dev", "*.replit.dev"],
  images: {
    // Cache optimised images in the Next.js image cache for 1 hour
    minimumCacheTTL: 3600,
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "plus.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "lh3.googleusercontent.com", // Google profile photos
      },
    ],
  },
};

export default nextConfig;

import type { NextConfig } from "next";

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

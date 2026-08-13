import type { NextConfig } from "next";

function isValidGoogleClientId(value?: string): boolean {
  if (!value) return false;
  const trimmed = value.trim();
  if (!trimmed || /\s/.test(trimmed)) return false;
  return /^[A-Za-z0-9_-]+\.apps\.googleusercontent\.com$/i.test(trimmed);
}

// ─── Production environment guard ────────────────────────────────────────────
// Fail loudly at build / startup so a misconfigured deployment is immediately
// visible rather than silently broken for end-users.
if (process.env.NODE_ENV === "production" && !process.env.RESEND_API_KEY) {
  throw new Error(
    "[config] RESEND_API_KEY is required in production. " +
      "New users will not receive verification emails without it. " +
      "Set the secret in your deployment environment and redeploy."
  );
}

const nextConfig: NextConfig = {
  // Expose a public flag so client components can conditionally show Google Sign-In.
  // Only enable when both env vars are present and the client ID matches the Google format.
  env: {
    NEXT_PUBLIC_HAS_GOOGLE:
      process.env.GOOGLE_CLIENT_ID &&
      process.env.GOOGLE_CLIENT_SECRET &&
      isValidGoogleClientId(process.env.GOOGLE_CLIENT_ID)
        ? "1"
        : "0",
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

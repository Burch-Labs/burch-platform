import type { NextConfig } from "next";

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

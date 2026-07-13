import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Replit's proxied preview domain as a dev origin
  allowedDevOrigins: ["*.picard.replit.dev", "*.replit.dev"],
  images: {
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

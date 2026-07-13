import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow Replit's proxied preview domain as a dev origin
  allowedDevOrigins: ["*.picard.replit.dev", "*.replit.dev"],
};

export default nextConfig;

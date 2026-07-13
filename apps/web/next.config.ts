import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow all hosts for Replit's proxied preview
  async headers() {
    return [];
  },
};

export default nextConfig;

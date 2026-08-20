import type { MetadataRoute } from "next";
import { resolveBaseUrl } from "@/lib/config-check";

const SITE_URL = resolveBaseUrl();

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/admin/",
          "/api/",
          "/partner/",
          "/settings",
          "/bookings",
          "/tickets/",
          "/auth/",
        ],
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}

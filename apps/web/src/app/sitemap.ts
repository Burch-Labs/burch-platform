import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { resolveBaseUrl } from "@/lib/config-check";

const SITE_URL = resolveBaseUrl();

const STATIC_ROUTES = ["", "/events", "/hotels", "/restaurants", "/clubs"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [events, hotels, restaurants, clubs] = await Promise.all([
    prisma.event.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.hotel.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.restaurant.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    }),
    prisma.club.findMany({
      where: { published: true },
      select: { id: true, updatedAt: true },
    }),
  ]);

  const staticEntries: MetadataRoute.Sitemap = STATIC_ROUTES.map((path) => ({
    url: `${SITE_URL}${path}`,
    changeFrequency: path === "" ? "daily" : "hourly",
    priority: path === "" ? 1 : 0.8,
  }));

  const eventEntries: MetadataRoute.Sitemap = events.map((e) => ({
    url: `${SITE_URL}/events/${e.id}`,
    lastModified: e.updatedAt,
    changeFrequency: "daily",
    priority: 0.7,
  }));

  const hotelEntries: MetadataRoute.Sitemap = hotels.map((h) => ({
    url: `${SITE_URL}/hotels/${h.id}`,
    lastModified: h.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const restaurantEntries: MetadataRoute.Sitemap = restaurants.map((r) => ({
    url: `${SITE_URL}/restaurants/${r.id}`,
    lastModified: r.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const clubEntries: MetadataRoute.Sitemap = clubs.map((c) => ({
    url: `${SITE_URL}/clubs/${c.id}`,
    lastModified: c.updatedAt,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  return [...staticEntries, ...eventEntries, ...hotelEntries, ...restaurantEntries, ...clubEntries];
}

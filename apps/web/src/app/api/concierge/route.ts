import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { callClaude, extractJson, HAS_ANTHROPIC } from "@/lib/agents/claude";

const schema = z.object({
  message: z.string().min(1).max(500),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

async function fetchContext() {
  const [events, hotels, restaurants] = await Promise.all([
    prisma.event.findMany({
      where: { published: true, startDate: { gte: new Date() } },
      select: {
        id: true, title: true, category: true, city: true, location: true,
        price: true, currency: true, startDate: true, imageUrl: true,
      },
      orderBy: { startDate: "asc" },
      take: 20,
    }),
    prisma.hotel.findMany({
      where: { published: true },
      select: {
        id: true, name: true, city: true, starRating: true, imageUrl: true,
        rooms: { select: { price: true, currency: true }, orderBy: { price: "asc" }, take: 1 },
      },
      take: 15,
    }),
    prisma.restaurant.findMany({
      where: { published: true },
      select: {
        id: true, name: true, city: true, cuisine: true, priceRange: true,
        location: true, imageUrl: true,
      },
      take: 20,
    }),
  ]);
  return { events, hotels, restaurants };
}

type Ctx = Awaited<ReturnType<typeof fetchContext>>;
type RawRec = { type: string; id: string; reason: string };

async function enrichRecommendations(recs: RawRec[], ctx: Ctx) {
  return recs.map((rec) => {
    if (rec.type === "hotel") {
      const h = ctx.hotels.find((x) => x.id === rec.id);
      if (!h) return null;
      return {
        ...rec,
        name: h.name,
        city: h.city,
        imageUrl: h.imageUrl,
        subtitle: `${h.starRating ?? "?"}★ Hotel`,
        meta: h.rooms[0] ? `from KES ${Number(h.rooms[0].price).toLocaleString()}/night` : "",
        href: `/hotels/${h.id}`,
      };
    }
    if (rec.type === "restaurant") {
      const r = ctx.restaurants.find((x) => x.id === rec.id);
      if (!r) return null;
      return {
        ...rec,
        name: r.name,
        city: r.city,
        imageUrl: r.imageUrl,
        subtitle: r.cuisine ?? "Restaurant",
        meta: ["KES", "KES KES", "KES KES KES", "KES KES KES KES"][Math.max(0, (r.priceRange ?? 2) - 1)],
        href: `/restaurants/${r.id}`,
      };
    }
    if (rec.type === "event") {
      const e = ctx.events.find((x) => x.id === rec.id);
      if (!e) return null;
      return {
        ...rec,
        name: e.title,
        city: e.city,
        imageUrl: e.imageUrl,
        subtitle: `${e.category} · ${new Date(e.startDate).toLocaleDateString("en-KE", { day: "numeric", month: "short" })}`,
        meta: Number(e.price) === 0 ? "Free entry" : `KES ${Number(e.price).toLocaleString()}`,
        href: `/events/${e.id}`,
      };
    }
    return null;
  }).filter(Boolean);
}

function buildSystemPrompt(ctx: Ctx) {
  const eventsText = ctx.events.map((e) =>
    `- [EVENT:${e.id}] "${e.title}" | ${e.category} | ${e.city} | KES ${Number(e.price).toLocaleString()} | ${new Date(e.startDate).toDateString()}`
  ).join("\n");
  const hotelsText = ctx.hotels.map((h) =>
    `- [HOTEL:${h.id}] "${h.name}" | ${h.city} | ${h.starRating ?? "?"}★ | from KES ${h.rooms[0] ? Number(h.rooms[0].price).toLocaleString() : "?"}/night`
  ).join("\n");
  const restaurantsText = ctx.restaurants.map((r) =>
    `- [RESTAURANT:${r.id}] "${r.name}" | ${r.city} | ${r.cuisine ?? "Various"} | ${"KES".repeat(r.priceRange ?? 2)}`
  ).join("\n");

  return `You are Burch AI Concierge — a warm, expert travel and lifestyle assistant for Africa.
Help users discover events, hotels, restaurants, and plan trips across the continent.

LIVE INVENTORY (use EXACT IDs in your recommendations):
UPCOMING EVENTS:
${eventsText || "None available."}

HOTELS:
${hotelsText || "None listed."}

RESTAURANTS:
${restaurantsText || "None listed."}

RESPONSE FORMAT — return ONLY valid JSON with this exact shape:
{
  "text": "your conversational reply (2-4 sentences, warm and specific)",
  "recommendations": [
    { "type": "event"|"hotel"|"restaurant", "id": "exact-id", "reason": "one sentence why" }
  ],
  "itinerary": [
    { "day": 1, "title": "Day 1 — Arrival", "activities": ["10:00 Check in to hotel", "13:00 Lunch at restaurant"] }
  ]
}
Rules:
- itinerary is ONLY for multi-day trip planning (e.g. "3 days in Nairobi"). Otherwise set it to null.
- recommendations: 2-4 items, mix types when relevant. Use only IDs from the inventory above.
- No markdown, no code fences. Pure JSON only.`;
}

function buildFallbackResponse(message: string, ctx: Ctx) {
  const lower = message.toLowerCase();
  const cities = ["nairobi", "lagos", "accra", "johannesburg", "cape town", "kigali", "kampala", "dar es salaam", "cairo", "addis ababa"];
  const mentionedCity = cities.find((c) => lower.includes(c));

  const isRomantic = lower.includes("romantic") || lower.includes("date night") || lower.includes("anniversary");
  const isHotel = lower.includes("hotel") || lower.includes("stay") || lower.includes("accommodation") || lower.includes("sleep");
  const isEvent = lower.includes("event") || lower.includes("concert") || lower.includes("festival") || lower.includes("show");
  const isRestaurant = lower.includes("dinner") || lower.includes("lunch") || lower.includes("eat") || lower.includes("restaurant") || lower.includes("food");
  const isItinerary = /\d+\s*day/.test(lower) || lower.includes("itinerary") || lower.includes("trip plan") || lower.includes("days in");

  const filterCity = <T extends { city: string }>(items: T[]) =>
    mentionedCity ? items.filter((i) => i.city.toLowerCase().includes(mentionedCity)) : items;

  const recs: RawRec[] = [];

  if (isRestaurant || isRomantic) {
    filterCity(ctx.restaurants).slice(0, 2).forEach((r, i) =>
      recs.push({ type: "restaurant", id: r.id, reason: i === 0 ? (isRomantic ? "Perfect romantic atmosphere and cuisine" : "Top-rated dining experience") : "Another excellent option nearby" })
    );
  }
  if (isHotel || isItinerary) {
    const h = filterCity(ctx.hotels)[0];
    if (h) recs.push({ type: "hotel", id: h.id, reason: mentionedCity ? `Best accommodation in ${mentionedCity}` : "Highly recommended stay" });
  }
  if (isEvent || isItinerary) {
    const e = filterCity(ctx.events)[0];
    if (e) recs.push({ type: "event", id: e.id, reason: "A must-attend experience during your visit" });
  }

  if (recs.length === 0) {
    ctx.restaurants.slice(0, 1).forEach((r) => recs.push({ type: "restaurant", id: r.id, reason: "Top dining pick" }));
    ctx.hotels.slice(0, 1).forEach((h) => recs.push({ type: "hotel", id: h.id, reason: "Excellent accommodation" }));
    ctx.events.slice(0, 1).forEach((e) => recs.push({ type: "event", id: e.id, reason: "Upcoming experience not to miss" }));
  }

  const cityStr = mentionedCity ? ` in ${mentionedCity.charAt(0).toUpperCase() + mentionedCity.slice(1)}` : "";
  let text = "";
  if (isRomantic) text = `For a romantic evening${cityStr}, I've selected some of our most intimate experiences. Whether you're celebrating something special or simply enjoying each other's company, these picks will make it memorable.`;
  else if (isItinerary) text = `Here's a curated selection for your trip${cityStr}! I've handpicked the highlights from our collection — tap any card to explore and book.`;
  else if (isHotel) text = `Here are the finest stays${cityStr} in our collection. All properties are carefully selected for comfort, service, and location.`;
  else if (isEvent) text = `There are some exciting events coming up${cityStr}! Here are the highlights worth adding to your calendar.`;
  else if (isRestaurant) text = `These are my top dining recommendations${cityStr} — each one offers a distinct and memorable experience.`;
  else text = `Here's what's on at Burch${cityStr} right now. I've picked a mix of dining, accommodation, and events to inspire your next adventure.`;

  return { text, recommendations: recs, itinerary: null };
}

export async function POST(req: NextRequest) {
  try {
    const { message, history } = schema.parse(await req.json());
    const ctx = await fetchContext();

    let raw: { text: string; recommendations: RawRec[]; itinerary: unknown; powered: string };

    if (HAS_ANTHROPIC) {
      const systemPrompt = buildSystemPrompt(ctx);
      const text = await callClaude({
        system: systemPrompt,
        messages: [...(history ?? []).slice(-6), { role: "user", content: message }],
      });
      raw = { ...extractJson<{ text: string; recommendations: RawRec[]; itinerary: unknown }>(text), powered: "anthropic" };
    } else if (OPENAI_API_KEY) {
      const systemPrompt = buildSystemPrompt(ctx);
      const messages = [
        { role: "system", content: systemPrompt },
        ...(history ?? []).slice(-6),
        { role: "user", content: message },
      ];

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${OPENAI_API_KEY}` },
        body: JSON.stringify({ model: "gpt-4o-mini", messages, temperature: 0.7, max_tokens: 1200, response_format: { type: "json_object" } }),
      });

      if (!response.ok) throw new Error(`OpenAI: ${await response.text()}`);
      const data = await response.json();
      const parsed = JSON.parse(data.choices[0]?.message?.content ?? "{}");
      raw = { ...parsed, powered: "openai" };
    } else {
      const fallback = buildFallbackResponse(message, ctx);
      raw = { ...fallback, powered: "fallback" };
    }

    const enriched = await enrichRecommendations(raw.recommendations ?? [], ctx);
    return NextResponse.json({ ...raw, recommendations: enriched });
  } catch (err) {
    if (err instanceof z.ZodError) return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    console.error("[POST /api/concierge]", err);
    return NextResponse.json({ error: "Concierge is unavailable right now." }, { status: 500 });
  }
}

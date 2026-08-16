"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

interface Recommendation {
  type: string;
  id: string;
  name: string;
  city: string;
  imageUrl?: string | null;
  subtitle: string;
  meta: string;
  reason: string;
  href: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: string[];
}

interface Message {
  role: "user" | "assistant";
  content: string;
  recommendations?: Recommendation[];
  itinerary?: ItineraryDay[] | null;
}

const SUGGESTIONS = [
  "I want a romantic dinner tonight",
  "Best hotels in Nairobi under 30k",
  "Plan 3 days in Lagos",
  "What events are happening in Accra?",
  "Show me fine dining in Cape Town",
];

const TYPE_ICONS: Record<string, string> = {
  hotel: "🏨",
  restaurant: "🍽️",
  event: "🎟️",
};

export function ConciergeChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm your dontbeboring AI Concierge. I can help you discover the best hotels, restaurants, and events across Kenya — or plan a full travel itinerary. What are you looking for today?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(text: string) {
    if (!text.trim() || loading) return;
    const userMsg: Message = { role: "user", content: text.trim() };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    const history = messages
      .filter((m) => m.role !== "assistant" || !m.recommendations)
      .map((m) => ({ role: m.role, content: m.content }))
      .slice(-6);

    try {
      const res = await fetch("/api/concierge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text.trim(), history }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Error");

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.text ?? "Here are my recommendations.",
          recommendations: data.recommendations?.length ? data.recommendations : undefined,
          itinerary: data.itinerary ?? null,
        },
      ]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "I'm having trouble connecting right now. Please try again in a moment." },
      ]);
    } finally {
      setLoading(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  const showSuggestions = messages.length === 1;

  return (
    <div className="flex flex-col h-full">
      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 space-y-6">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm mr-3 mt-1 flex-shrink-0">
                ✦
              </div>
            )}
            <div className={`max-w-[85%] ${msg.role === "user" ? "max-w-[70%]" : ""}`}>
              {/* Bubble */}
              <div
                className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-orange-600 text-white rounded-tr-sm"
                    : "bg-white border border-gray-100 text-gray-700 rounded-tl-sm shadow-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Recommendation cards */}
              {msg.recommendations && msg.recommendations.length > 0 && (
                <div className="mt-3 space-y-2">
                  {msg.recommendations.map((rec, ri) => (
                    <RecommendationCard key={ri} rec={rec} />
                  ))}
                </div>
              )}

              {/* Itinerary */}
              {msg.itinerary && msg.itinerary.length > 0 && (
                <div className="mt-3 bg-white border border-gray-100 rounded-2xl p-4 shadow-sm">
                  <p className="text-xs font-semibold text-orange-600 uppercase tracking-wide mb-3">
                    Your Itinerary
                  </p>
                  <div className="space-y-4">
                    {msg.itinerary.map((day) => (
                      <div key={day.day}>
                        <p className="text-sm font-semibold text-gray-900 mb-1.5">
                          Day {day.day} — {day.title}
                        </p>
                        <ul className="space-y-1">
                          {day.activities.map((act, ai) => (
                            <li key={ai} className="text-xs text-gray-600 flex gap-2">
                              <span className="text-orange-400 mt-0.5">›</span>
                              <span>{act}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {loading && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white text-sm mr-3 flex-shrink-0">
              ✦
            </div>
            <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-sm px-4 py-3 shadow-sm">
              <div className="flex gap-1 items-center h-4">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full bg-gray-400 animate-bounce"
                    style={{ animationDelay: `${i * 0.15}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Suggestions */}
      {showSuggestions && (
        <div className="px-4 sm:px-6 pb-3">
          <p className="text-xs text-gray-400 mb-2">Try asking…</p>
          <div className="flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="text-xs bg-gray-50 border border-gray-200 text-gray-600 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 px-3 py-1.5 rounded-full transition"
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="border-t border-gray-100 bg-white px-4 sm:px-6 py-4">
        <div className="flex items-end gap-3">
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ask about hotels, restaurants, events, or trip planning…"
            rows={1}
            disabled={loading}
            className="flex-1 border border-gray-200 rounded-xl px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 disabled:opacity-50 min-h-[44px] max-h-32"
            style={{ height: "44px" }}
            onInput={(e) => {
              const el = e.currentTarget;
              el.style.height = "44px";
              el.style.height = Math.min(el.scrollHeight, 128) + "px";
            }}
          />
          <button
            onClick={() => send(input)}
            disabled={!input.trim() || loading}
            className="bg-orange-600 text-white p-3 rounded-xl hover:bg-orange-700 transition disabled:opacity-40 flex-shrink-0"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
        <p className="text-xs text-gray-400 mt-2 text-center">
          Powered by dontbeboring AI · Recommendations are based on live availability
        </p>
      </div>
    </div>
  );
}

function RecommendationCard({ rec }: { rec: Recommendation }) {
  return (
    <Link
      href={rec.href}
      className="flex items-center gap-3 bg-gray-50 border border-gray-100 hover:border-orange-200 hover:bg-orange-50 rounded-xl p-3 transition group"
    >
      <div className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200">
        {rec.imageUrl ? (
          <Image src={rec.imageUrl} alt={rec.name} fill className="object-cover" sizes="56px" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-xl">
            {TYPE_ICONS[rec.type] ?? "📍"}
          </div>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-xs text-gray-400">{TYPE_ICONS[rec.type]}</span>
          <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-700 transition">
            {rec.name}
          </p>
        </div>
        <p className="text-xs text-gray-500 truncate">{rec.subtitle} · {rec.city}</p>
        <p className="text-xs text-orange-600 font-medium">{rec.meta}</p>
        <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{rec.reason}</p>
      </div>
      <svg className="w-4 h-4 text-gray-300 group-hover:text-orange-500 flex-shrink-0 transition" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </Link>
  );
}

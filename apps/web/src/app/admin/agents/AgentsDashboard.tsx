"use client";

import { useState } from "react";

interface AgentMeta {
  id: string;
  name: string;
  description: string;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

const AGENT_ICON: Record<string, string> = {
  ceo: "👔",
  booking: "🎫",
  concierge: "🧭",
  hotel: "🏨",
  restaurant: "🍽️",
  support: "💬",
  marketing: "📣",
  revenue: "💰",
  analytics: "📊",
  fraud: "🚨",
  developer: "💻",
};

export function AgentsDashboard({ agents }: { agents: AgentMeta[] }) {
  const [selectedId, setSelectedId] = useState(agents[0]?.id ?? "");
  const [historyByAgent, setHistoryByAgent] = useState<Record<string, ChatMessage[]>>({});
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState("");

  const selected = agents.find((a) => a.id === selectedId);
  const history = historyByAgent[selectedId] ?? [];

  async function send() {
    const message = input.trim();
    if (!message || isSending) return;

    setError("");
    setInput("");
    const nextHistory = [...history, { role: "user" as const, content: message }];
    setHistoryByAgent((prev) => ({ ...prev, [selectedId]: nextHistory }));
    setIsSending(true);

    try {
      const res = await fetch(`/api/agents/${selectedId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, history: nextHistory.slice(0, -1) }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Something went wrong.");
        return;
      }
      setHistoryByAgent((prev) => ({
        ...prev,
        [selectedId]: [...nextHistory, { role: "assistant", content: data.text }],
      }));
    } catch {
      setError("Couldn't reach the agent — check your connection and try again.");
    } finally {
      setIsSending(false);
    }
  }

  return (
    <div className="flex flex-col md:flex-row gap-6">
      {/* Agent picker */}
      <div className="md:w-64 flex-shrink-0">
        <div className="bg-surface rounded-2xl border border-gray-200 divide-y divide-gray-50 overflow-hidden">
          {agents.map((agent) => (
            <button
              key={agent.id}
              onClick={() => setSelectedId(agent.id)}
              className={`w-full text-left px-4 py-3 flex items-start gap-3 transition ${
                agent.id === selectedId ? "bg-orange-50" : "hover:bg-gray-50"
              }`}
            >
              <span className="text-lg leading-none mt-0.5">{AGENT_ICON[agent.id] ?? "🤖"}</span>
              <div className="min-w-0">
                <p className={`text-sm font-semibold truncate ${agent.id === selectedId ? "text-orange-700" : "text-gray-900"}`}>
                  {agent.name}
                </p>
                <p className="text-xs text-gray-400 mt-0.5 line-clamp-2">{agent.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat panel */}
      <div className="flex-1 min-w-0 flex flex-col bg-surface rounded-2xl border border-gray-200 h-[560px]">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2.5">
          <span className="text-lg leading-none">{AGENT_ICON[selectedId] ?? "🤖"}</span>
          <p className="text-sm font-semibold text-gray-900">{selected?.name}</p>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {history.length === 0 ? (
            <p className="text-sm text-gray-400 text-center mt-10">
              {selected?.description} Ask it something to get started.
            </p>
          ) : (
            history.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-orange-600 text-white"
                      : "bg-gray-50 text-gray-800 border border-gray-100"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))
          )}
          {isSending && (
            <div className="flex justify-start">
              <div className="bg-gray-50 border border-gray-100 rounded-2xl px-4 py-2.5 text-sm text-gray-400">
                Thinking…
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="mx-5 mb-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl px-3 py-2">
            {error}
          </div>
        )}

        <div className="border-t border-gray-100 p-3 flex items-end gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            rows={1}
            placeholder={`Ask the ${selected?.name ?? "agent"}…`}
            className="flex-1 resize-none border border-gray-200 rounded-xl px-3.5 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 focus:border-transparent max-h-32"
          />
          <button
            onClick={send}
            disabled={isSending || !input.trim()}
            className="bg-orange-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition disabled:opacity-50 flex-shrink-0"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}

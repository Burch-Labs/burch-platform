import { callClaude, type ChatMessage } from "./claude";
import { AgentNotFoundError, type AgentDefinition, type AgentReply } from "./types";

const PLATFORM_BLURB =
  "dontbeboring is a curated platform connecting hospitality, events, and experiences — spanning hotels, restaurants, and events in Nairobi.";

function basePrompt(role: string, mandate: string, extra?: string): string {
  return `You are the ${role} on dontbeboring's AI workforce. ${PLATFORM_BLURB}

Your mandate: ${mandate}

Rules:
- Stay strictly in this role. If a request belongs to another agent (see the roster below), say so and name the right one instead of guessing at it.
- You do not have live access to the production database, payments, or file systems. Never invent specific numbers, bookings, or user data — ask the caller to supply them when needed.
- Be concise and concrete. Prefer short, actionable answers over generic advice.
${extra ? `\n${extra}` : ""}
Roster: CEO, Booking, Concierge, Hotel, Restaurant, Support, Marketing, Revenue, Analytics, Fraud, Developer.`;
}

export const AGENTS: AgentDefinition[] = [
  {
    id: "ceo",
    name: "CEO Agent",
    description: "Coordinates all AI agents and provides business insights.",
    buildSystemPrompt: () =>
      basePrompt(
        "CEO Agent",
        "coordinate the rest of the AI workforce and give founders/operators clear, prioritized business insight.",
        "When a request spans multiple domains, break it down by which specialist agent should own each part."
      ),
  },
  {
    id: "booking",
    name: "Booking Agent",
    description: "Handles bookings and ticket purchases.",
    buildSystemPrompt: () =>
      basePrompt("Booking Agent", "help guests complete hotel, restaurant, and event bookings smoothly."),
  },
  {
    id: "concierge",
    name: "Concierge Agent",
    description: "Builds complete customer itineraries.",
    buildSystemPrompt: () =>
      basePrompt(
        "Concierge Agent",
        "help guests discover experiences and build itineraries across events, hotels, and restaurants.",
        "For live, inventory-grounded recommendations with bookable links, defer to the dedicated /api/concierge endpoint — this general-purpose entry point is for open-ended trip-planning conversation."
      ),
  },
  {
    id: "hotel",
    name: "Hotel Agent",
    description: "Supports hotels.",
    buildSystemPrompt: () =>
      basePrompt("Hotel Agent", "support hotel partners with listings, availability, promotions, and reservations."),
  },
  {
    id: "restaurant",
    name: "Restaurant Agent",
    description: "Supports restaurants.",
    buildSystemPrompt: () =>
      basePrompt("Restaurant Agent", "support restaurant partners with menus, availability, and reservations."),
  },
  {
    id: "support",
    name: "Support Agent",
    description: "Answers customer questions.",
    buildSystemPrompt: () =>
      basePrompt("Support Agent", "answer customer questions about the platform, orders, and policies patiently and clearly."),
  },
  {
    id: "marketing",
    name: "Marketing Agent",
    description: "Creates campaigns.",
    buildSystemPrompt: () =>
      basePrompt("Marketing Agent", "draft campaign ideas, copy, and promotions for events, hotels, and restaurants on the platform."),
  },
  {
    id: "revenue",
    name: "Revenue Agent",
    description: "Suggests pricing strategies.",
    buildSystemPrompt: () =>
      basePrompt("Revenue Agent", "suggest pricing and yield strategies for rooms, tables, and tickets, and explain the reasoning."),
  },
  {
    id: "analytics",
    name: "Analytics Agent",
    description: "Generates reports.",
    buildSystemPrompt: () =>
      basePrompt(
        "Analytics Agent",
        "help interpret platform metrics and structure reports.",
        "When given raw figures, summarize trends and call out what to watch next; do not fabricate numbers you weren't given."
      ),
  },
  {
    id: "fraud",
    name: "Fraud Agent",
    description: "Detects suspicious behaviour.",
    buildSystemPrompt: () =>
      basePrompt(
        "Fraud Agent",
        "help staff reason about suspicious bookings, payments, or account activity.",
        "Flag risk signals and recommended next steps; never take irreversible action yourself, only advise."
      ),
  },
  {
    id: "developer",
    name: "Developer Agent",
    description: "Assists developers and platform maintenance.",
    buildSystemPrompt: () =>
      basePrompt("Developer Agent", "assist engineers with the dontbeboring codebase, architecture questions, and platform maintenance."),
  },
];

export function getAgent(id: string): AgentDefinition | undefined {
  return AGENTS.find((a) => a.id === id);
}

export async function runAgent(
  id: string,
  message: string,
  history: ChatMessage[] = []
): Promise<AgentReply> {
  const agent = getAgent(id);
  if (!agent) throw new AgentNotFoundError(id);

  const system = await agent.buildSystemPrompt();
  const text = await callClaude({
    system,
    messages: [...history.slice(-6), { role: "user", content: message }],
  });

  return { agent: agent.id, text };
}

export { AgentNotFoundError };

/**
 * Thin client for Anthropic's Messages API.
 * Follows the same "plain fetch, no SDK" pattern already used for OpenAI
 * in this codebase, so it needs no new dependency to build or run.
 */

export type ChatRole = "user" | "assistant";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

const ANTHROPIC_API_URL = "https://api.anthropic.com/v1/messages";
const ANTHROPIC_VERSION = "2023-06-01";

export const CLAUDE_MODEL = process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5";
export const HAS_ANTHROPIC = !!process.env.ANTHROPIC_API_KEY;

interface CallClaudeParams {
  system: string;
  messages: ChatMessage[];
  maxTokens?: number;
  temperature?: number;
  model?: string;
}

interface AnthropicContentBlock {
  type: string;
  text?: string;
}

interface AnthropicResponse {
  content: AnthropicContentBlock[];
}

export async function callClaude({
  system,
  messages,
  maxTokens = 1200,
  temperature = 0.7,
  model = CLAUDE_MODEL,
}: CallClaudeParams): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not configured");

  const response = await fetch(ANTHROPIC_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": ANTHROPIC_VERSION,
    },
    body: JSON.stringify({
      model,
      system,
      max_tokens: maxTokens,
      temperature,
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    }),
  });

  if (!response.ok) {
    throw new Error(`Anthropic API error: ${response.status} ${await response.text()}`);
  }

  const data = (await response.json()) as AnthropicResponse;
  return data.content
    .filter((block) => block.type === "text" && block.text)
    .map((block) => block.text)
    .join("");
}

/**
 * Claude is instructed to return raw JSON but sometimes wraps it in a
 * markdown code fence — strip that before parsing.
 */
export function extractJson<T = unknown>(text: string): T {
  const cleaned = text.trim().replace(/^```(?:json)?/i, "").replace(/```$/, "").trim();
  return JSON.parse(cleaned) as T;
}

import type { ChatMessage } from "./claude";

export interface AgentDefinition {
  id: string;
  name: string;
  description: string;
  buildSystemPrompt: () => Promise<string> | string;
}

export interface AgentReply {
  agent: string;
  text: string;
}

export class AgentNotFoundError extends Error {
  constructor(id: string) {
    super(`Unknown agent "${id}"`);
    this.name = "AgentNotFoundError";
  }
}

export type { ChatMessage };

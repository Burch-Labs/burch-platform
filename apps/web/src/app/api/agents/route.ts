import { NextResponse } from "next/server";
import { HAS_ANTHROPIC } from "@/lib/agents/claude";
import { AGENTS } from "@/lib/agents/registry";

export async function GET() {
  return NextResponse.json({
    configured: HAS_ANTHROPIC,
    agents: AGENTS.map(({ id, name, description }) => ({ id, name, description })),
  });
}

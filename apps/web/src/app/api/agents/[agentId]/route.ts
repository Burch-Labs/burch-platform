import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { HAS_ANTHROPIC } from "@/lib/agents/claude";
import { AgentNotFoundError, runAgent } from "@/lib/agents/registry";

const schema = z.object({
  message: z.string().min(1).max(2000),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string() }))
    .optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ agentId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  const { agentId } = await params;

  if (!HAS_ANTHROPIC) {
    return NextResponse.json(
      { error: "AI agents are not configured. Set ANTHROPIC_API_KEY." },
      { status: 503 }
    );
  }

  try {
    const { message, history } = schema.parse(await req.json());
    const reply = await runAgent(agentId, message, history);
    return NextResponse.json(reply);
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    if (err instanceof AgentNotFoundError) {
      return NextResponse.json({ error: err.message }, { status: 404 });
    }
    console.error(`[POST /api/agents/${agentId}]`, err);
    return NextResponse.json({ error: "Agent is unavailable right now." }, { status: 500 });
  }
}

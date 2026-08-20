import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { isAdminRole } from "@/lib/roles";
import { HAS_ANTHROPIC } from "@/lib/agents/claude";
import { AGENTS } from "@/lib/agents/registry";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) {
    return NextResponse.json({ error: "Not authorized." }, { status: 401 });
  }

  return NextResponse.json({
    configured: HAS_ANTHROPIC,
    agents: AGENTS.map(({ id, name, description }) => ({ id, name, description })),
  });
}

import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { NavBar } from "@/components/layout/NavBar";
import { AdminNav } from "../AdminNav";
import { getQueueCounts } from "../queue-counts";
import { isAdminRole } from "@/lib/roles";
import { AGENTS } from "@/lib/agents/registry";
import { HAS_ANTHROPIC } from "@/lib/agents/claude";
import { AgentsDashboard } from "./AgentsDashboard";

export const metadata = { title: "AI agents — dontbeboringKE" };
export const dynamic = "force-dynamic";

export default async function AdminAgentsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !isAdminRole(session.user.role)) redirect("/dashboard?error=unauthorized");

  const counts = await getQueueCounts();

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-1">AI agents</h1>
        <p className="text-sm text-gray-500 mb-6">
          Role-specific assistants for running the platform — each one is scoped to a single job
          and will say so if you ask it something outside its lane.
        </p>

        <AdminNav active="/admin/agents" counts={counts} />

        {!HAS_ANTHROPIC && (
          <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded-2xl px-5 py-4">
            <p className="font-semibold mb-0.5">ANTHROPIC_API_KEY isn&apos;t set</p>
            <p>Agents will return an error until it&apos;s configured in the environment.</p>
          </div>
        )}

        <AgentsDashboard
          agents={AGENTS.map(({ id, name, description }) => ({ id, name, description }))}
        />
      </main>
    </div>
  );
}

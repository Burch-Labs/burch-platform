import { NextResponse } from "next/server";
import { configCheckResults, configIsHealthy } from "@/lib/config-check";

/**
 * GET /api/health
 *
 * Returns 200 when all required config is present and plausible.
 * Returns 503 when any error-level config issue is detected so that uptime
 * monitors and load-balancer health checks catch misconfigured deployments
 * before real users do.
 */
export async function GET() {
  const errors = configCheckResults.filter((i) => i.level === "error");
  const warnings = configCheckResults.filter((i) => i.level === "warn");

  const body = {
    status: configIsHealthy ? "ok" : "degraded",
    config: {
      errors: errors.map((i) => ({ key: i.key, message: i.message })),
      warnings: warnings.map((i) => ({ key: i.key, message: i.message })),
    },
    timestamp: new Date().toISOString(),
  };

  return NextResponse.json(body, {
    status: configIsHealthy ? 200 : 503,
  });
}

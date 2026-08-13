/**
 * Startup configuration validator.
 *
 * Runs once at module-load time and logs clear, actionable warnings for every
 * missing or suspect environment variable that would silently break auth or
 * email flows in production.
 *
 * Import this file anywhere that is guaranteed to be evaluated on server start
 * (e.g. auth.ts, email.ts, the health route) so that misconfigurations surface
 * immediately in deployment logs rather than only when a user hits the broken flow.
 */

export interface ConfigIssue {
  level: "error" | "warn";
  key: string;
  message: string;
}

function resolveBaseUrl(): string {
  if (process.env.NEXTAUTH_URL) return process.env.NEXTAUTH_URL;
  if (process.env.REPLIT_DOMAINS) {
    const primary = process.env.REPLIT_DOMAINS.split(",")[0].trim();
    return `https://${primary}`;
  }
  return "http://localhost:5000";
}

function isPlausibleUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function checkConfig(): ConfigIssue[] {
  const issues: ConfigIssue[] = [];
  const isProd = process.env.NODE_ENV === "production";

  // ── NEXTAUTH_SECRET / SESSION_SECRET ─────────────────────────────────────
  const hasSecret =
    !!process.env.NEXTAUTH_SECRET || !!process.env.SESSION_SECRET;
  if (!hasSecret) {
    issues.push({
      level: "error",
      key: "NEXTAUTH_SECRET",
      message:
        "Neither NEXTAUTH_SECRET nor SESSION_SECRET is set. " +
        "JWT sessions will fail. Set NEXTAUTH_SECRET to a long random string.",
    });
  }

  // ── NEXTAUTH_URL ─────────────────────────────────────────────────────────
  if (!process.env.NEXTAUTH_URL) {
    if (process.env.REPLIT_DOMAINS) {
      const primary = process.env.REPLIT_DOMAINS.split(",")[0].trim();
      issues.push({
        level: "warn",
        key: "NEXTAUTH_URL",
        message:
          `NEXTAUTH_URL is not set — falling back to REPLIT_DOMAINS (https://${primary}). ` +
          "Set NEXTAUTH_URL explicitly in the production environment for a stable canonical URL.",
      });
    } else {
      issues.push({
        level: isProd ? "error" : "warn",
        key: "NEXTAUTH_URL",
        message:
          "NEXTAUTH_URL is not set and REPLIT_DOMAINS is absent. " +
          "Email links and OAuth callbacks will point to http://localhost:5000. " +
          "Set NEXTAUTH_URL to the public URL of your deployment.",
      });
    }
  } else if (!isPlausibleUrl(process.env.NEXTAUTH_URL)) {
    issues.push({
      level: "error",
      key: "NEXTAUTH_URL",
      message: `NEXTAUTH_URL="${process.env.NEXTAUTH_URL}" is not a valid URL. OAuth callbacks and email links will break.`,
    });
  }

  // ── Google OAuth ─────────────────────────────────────────────────────────
  const hasGoogleId = !!process.env.GOOGLE_CLIENT_ID;
  const hasGoogleSecret = !!process.env.GOOGLE_CLIENT_SECRET;

  if (hasGoogleId && !hasGoogleSecret) {
    issues.push({
      level: "error",
      key: "GOOGLE_CLIENT_SECRET",
      message:
        "GOOGLE_CLIENT_ID is set but GOOGLE_CLIENT_SECRET is missing. " +
        "Google sign-in will fail. Add GOOGLE_CLIENT_SECRET or remove both vars to disable Google auth.",
    });
  }
  if (!hasGoogleId && hasGoogleSecret) {
    issues.push({
      level: "error",
      key: "GOOGLE_CLIENT_ID",
      message:
        "GOOGLE_CLIENT_SECRET is set but GOOGLE_CLIENT_ID is missing. " +
        "Google sign-in will fail. Add GOOGLE_CLIENT_ID or remove both vars to disable Google auth.",
    });
  }
  if (!hasGoogleId && !hasGoogleSecret) {
    issues.push({
      level: "warn",
      key: "GOOGLE_CLIENT_ID",
      message:
        "GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set. " +
        "Google Sign-In is disabled. This is fine for email-only auth.",
    });
  }

  // ── Resend (email) ───────────────────────────────────────────────────────
  if (!process.env.RESEND_API_KEY) {
    issues.push({
      level: isProd ? "error" : "warn",
      key: "RESEND_API_KEY",
      message:
        "RESEND_API_KEY is not set. " +
        (isProd
          ? "Verification and password-reset emails will NOT be sent in production. Set RESEND_API_KEY."
          : "Email links will be logged to the console instead of sent (dev mode)."),
    });
  } else if (!process.env.RESEND_API_KEY.startsWith("re_")) {
    issues.push({
      level: "warn",
      key: "RESEND_API_KEY",
      message:
        'RESEND_API_KEY does not start with "re_" — this may not be a valid Resend API key.',
    });
  }

  // ── AI agents (Anthropic / OpenAI) ───────────────────────────────────────
  if (!process.env.ANTHROPIC_API_KEY && !process.env.OPENAI_API_KEY) {
    issues.push({
      level: "warn",
      key: "ANTHROPIC_API_KEY",
      message:
        "Neither ANTHROPIC_API_KEY nor OPENAI_API_KEY is set. " +
        "The Concierge and /api/agents endpoints will fall back to rule-based responses instead of Claude/GPT.",
    });
  }

  // ── M-Pesa (event ticket payments) ───────────────────────────────────────
  const mpesaKeys = ["MPESA_CONSUMER_KEY", "MPESA_CONSUMER_SECRET", "MPESA_PASSKEY", "MPESA_SHORTCODE"] as const;
  const mpesaPresent = mpesaKeys.filter((k) => !!process.env[k]);
  if (mpesaPresent.length > 0 && mpesaPresent.length < mpesaKeys.length) {
    const missing = mpesaKeys.filter((k) => !process.env[k]);
    issues.push({
      level: isProd ? "error" : "warn",
      key: "MPESA_CONSUMER_KEY",
      message:
        `M-Pesa is partially configured — missing ${missing.join(", ")}. ` +
        "STK Push stays disabled until all four MPESA_* variables are set, but this looks like an incomplete setup rather than an intentional one.",
    });
  }

  // ── Flutterwave (card payments) ──────────────────────────────────────────
  if (process.env.FLUTTERWAVE_SECRET_KEY && !process.env.FLUTTERWAVE_SECRET_HASH) {
    issues.push({
      level: isProd ? "error" : "warn",
      key: "FLUTTERWAVE_SECRET_HASH",
      message:
        "FLUTTERWAVE_SECRET_KEY is set but FLUTTERWAVE_SECRET_HASH is missing. " +
        "Card payments can still be initiated, but the webhook will reject every callback (no valid signature to check against), " +
        "so confirmation relies entirely on the browser-redirect fallback. Set FLUTTERWAVE_SECRET_HASH to the value configured in your Flutterwave dashboard webhook settings.",
    });
  }

  return issues;
}

// ─── Run once at module load time ────────────────────────────────────────────

const configIssues: ConfigIssue[] = checkConfig();

const errorCount = configIssues.filter((i) => i.level === "error").length;
const warnCount = configIssues.filter((i) => i.level === "warn").length;

if (configIssues.length > 0) {
  const border = "═".repeat(60);
  console.log(`\n${border}`);
  console.log("⚙️   BURCH — CONFIG CHECK");
  console.log(border);

  for (const issue of configIssues) {
    const prefix = issue.level === "error" ? "❌ ERROR" : "⚠️  WARN ";
    console.log(`${prefix}  [${issue.key}]`);
    console.log(`         ${issue.message}`);
  }

  console.log(border);
  if (errorCount > 0) {
    console.log(
      `🔴  ${errorCount} error(s), ${warnCount} warning(s). Fix errors before going live.\n`
    );
  } else {
    console.log(`🟡  ${warnCount} warning(s). Review before going live.\n`);
  }
}

// ─── Exports for health-check endpoint ───────────────────────────────────────

export const configCheckResults = configIssues;
export const configIsHealthy = errorCount === 0;
export const configBaseUrl = resolveBaseUrl();

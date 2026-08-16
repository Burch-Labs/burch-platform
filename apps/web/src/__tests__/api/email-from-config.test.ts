/**
 * EMAIL_FROM validation.
 *
 * This exists because of a failure with no symptoms. With a valid Resend key but
 * no EMAIL_FROM, mail goes out as onboarding@resend.dev — Resend's sandbox
 * sender, which delivers only to the account owner. Every send returns success.
 * Nothing throws. Sign-in codes are the only way into an account, so the site
 * works perfectly for whoever is testing it and is completely unusable for every
 * real customer, with nothing in the logs to say why.
 *
 * The check has to fire at startup, which is the last moment it is still cheap.
 */

import type { ConfigIssue } from "@/lib/config-check";

/** Loads config-check fresh under a given environment and returns its issues. */
async function issuesUnder(env: Record<string, string | undefined>): Promise<ConfigIssue[]> {
  const saved = process.env;
  process.env = { ...saved, ...env } as NodeJS.ProcessEnv;
  for (const [k, v] of Object.entries(env)) {
    if (v === undefined) delete process.env[k];
  }

  let results: ConfigIssue[] = [];
  await jest.isolateModulesAsync(async () => {
    ({ configCheckResults: results } = await import("@/lib/config-check"));
  });

  process.env = saved;
  return results;
}

const PROD = {
  NODE_ENV: "production",
  DATABASE_URL: "postgresql://x",
  NEXTAUTH_SECRET: "s",
  NEXTAUTH_URL: "https://example.com",
  RESEND_API_KEY: "re_live_key",
  TICKET_SIGNING_SECRET: "t",
};

const emailFromIssues = (issues: ConfigIssue[]) => issues.filter((i) => i.key === "EMAIL_FROM");

describe("EMAIL_FROM", () => {
  it("is an error in production when unset, because delivery silently fails", async () => {
    const found = emailFromIssues(await issuesUnder({ ...PROD, EMAIL_FROM: undefined }));
    expect(found).toHaveLength(1);
    expect(found[0].level).toBe("error");
    expect(found[0].message).toMatch(/resend\.dev/);
  });

  it("names the consequence, not just the missing variable", async () => {
    // A warning that only says "EMAIL_FROM is not set" gets scrolled past.
    const [issue] = emailFromIssues(await issuesUnder({ ...PROD, EMAIL_FROM: undefined }));
    expect(issue.message).toMatch(/sign-in codes/i);
  });

  it("stays quiet when a verified-domain sender is configured", async () => {
    expect(
      emailFromIssues(await issuesUnder({ ...PROD, EMAIL_FROM: "dontbeboring <hello@example.com>" }))
    ).toHaveLength(0);
  });

  it("accepts a bare address as well as a display name", async () => {
    expect(
      emailFromIssues(await issuesUnder({ ...PROD, EMAIL_FROM: "hello@example.com" }))
    ).toHaveLength(0);
  });

  it("rejects a sender that is not an address at all", async () => {
    const [issue] = emailFromIssues(await issuesUnder({ ...PROD, EMAIL_FROM: "dontbeboring" }));
    expect(issue.level).toBe("error");
  });

  it("rejects an explicitly configured resend.dev sender", async () => {
    // Setting it by hand to the sandbox domain is the same silent failure,
    // just arrived at deliberately.
    const [issue] = emailFromIssues(
      await issuesUnder({ ...PROD, EMAIL_FROM: "dontbeboring <onboarding@resend.dev>" })
    );
    expect(issue.level).toBe("error");
  });

  it("does not nag in development, where mail is logged rather than sent", async () => {
    const found = emailFromIssues(
      await issuesUnder({ NODE_ENV: "development", RESEND_API_KEY: undefined, EMAIL_FROM: undefined })
    );
    expect(found).toHaveLength(0);
  });
});

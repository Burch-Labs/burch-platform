# Deployment

## Current target: Replit (autoscale)

The app is deployed via Replit's autoscale deployment, configured in `.replit`:

```
[deployment]
deploymentTarget = "autoscale"
build = ["bash", "-c", "npm install && cd apps/web && npm run build"]
run = ["bash", "-c", "cd apps/web && npm run start"]
```

Replit's dev preview URL (`*.replit.dev`) is ephemeral — it sleeps when the workspace isn't active and can change if the workspace is recreated. The production URL (`*.replit.app`, or a custom domain attached to the deployment) is the stable one; that's what `NEXTAUTH_URL` should point to in production.

**Alternative:** if you want a custom domain without paying for Replit's always-on tier, Render or Vercel both work well for this Next.js + Prisma + PostgreSQL stack — free tier, deploys on every push to `main`, stable URL. This would mean provisioning a separate production Postgres (Render/Neon/Supabase) instead of Replit's built-in one. Not required, just an option if the Replit URL situation becomes a problem.

## Environment variables

Every variable below is checked at startup by `apps/web/src/lib/config-check.ts` — misconfigurations print a clear `⚙️ BURCH — CONFIG CHECK` block in the deployment logs, and `GET /api/health` returns `503` if anything is at `error` level. Check that endpoint after every deploy.

| Variable | Required? | Notes |
|---|---|---|
| `DATABASE_URL` | **Required** | Replit-managed in this environment — don't set manually there. If migrating off Replit, point this at your production Postgres. |
| `NEXTAUTH_SECRET` | **Required in production** | Long random string. `SESSION_SECRET` works as a fallback name but pick one and set it. |
| `NEXTAUTH_URL` | **Required in production** | The public URL of the deployment. Without it, email links and OAuth callbacks default to `localhost:5000`. |
| `RESEND_API_KEY` | **Required in production** | `next.config.ts` refuses to build in production without it — no verification/reset emails otherwise. |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Optional | Both or neither. Enables Google sign-in. |
| `ANTHROPIC_API_KEY` | Recommended | Powers the Concierge and `/api/agents/*`. Falls back to a rule-based responder if unset — functional, but much less useful. |
| `OPENAI_API_KEY` | Optional | Secondary fallback behind Anthropic for the Concierge only. |
| `MPESA_CONSUMER_KEY`, `MPESA_CONSUMER_SECRET`, `MPESA_PASSKEY`, `MPESA_SHORTCODE` | Required together for M-Pesa | All four or none — partial sets are flagged as a config error in production. Get these from the [Daraja portal](https://developer.safaricom.co.ke/); production shortcode approval is the slow step, apply early. |
| `MPESA_ENV` | Optional | `sandbox` (default) or `production`. |
| `FLUTTERWAVE_SECRET_KEY` | Required for card payments | From the Flutterwave dashboard. |
| `FLUTTERWAVE_SECRET_HASH` | Required alongside the key above | Set in Flutterwave's dashboard webhook config, then mirrored here — without it the webhook silently rejects every callback (payments still confirm via the browser-redirect fallback, but you lose the async safety net). |
| `EMAIL_OVERRIDE_TO` | Optional, useful pre-launch | Redirects *every* outgoing email (including partner enquiry notifications for the seeded demo hotels/restaurants) to one inbox. Set this to your own address until real partners are onboarded with real emails, or those enquiries go nowhere. |
| `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Optional | Image uploads for partner-submitted listing photos. |

Never commit real values for any of these to the repo — this project has already had one credential leak (`.replit`'s `GITHUB_SSH_KEY`, removed but rotate it if you haven't). Use Replit's Secrets pane (or Render/Vercel's environment variable settings) instead.

## Database

- Apply schema changes with `cd apps/web && npm run db:push` (or generate a real migration with `prisma migrate` if you want migration history — this repo currently uses `db push`).
- **Back up before any schema change that touches existing data**, especially the `Payment` model added for ticket checkout — it's the transaction ledger. `pg_dump "$DATABASE_URL" > backup.sql` before running `db:push` in production is cheap insurance.
- Replit's built-in Postgres doesn't have a documented automatic backup/point-in-time-recovery story as of this writing — if that matters for a paying product, either script periodic `pg_dump`s to external storage or migrate to a provider with managed backups (Render Postgres, Neon, Supabase all have this).

## Monitoring (Sentry)

Not wired up yet, despite being listed in `TECH_STACK.md`. To add it properly:

```bash
cd apps/web
npx @sentry/wizard@latest -i nextjs
```

Run the wizard rather than hand-writing the config — it detects the installed Next.js/React versions and writes compatible instrumentation files, which matters more than it sounds (Sentry's Next.js integration has changed shape more than once). It will ask for your Sentry DSN and org/project slugs, and add `SENTRY_DSN` (or similar) to your env — add that to the table above and to Replit Secrets once it's in.

Until then, `GET /api/health` is the only structured signal available — point an uptime monitor (UptimeRobot, Better Uptime, even a Replit-side cron hitting it) at it so a `503` gets noticed.

## Pre-launch checklist

- [ ] `NEXTAUTH_SECRET` and `NEXTAUTH_URL` set to real values in the production environment
- [ ] `RESEND_API_KEY` set and sending domain verified in Resend (unverified domains get rate-limited/blocked)
- [ ] `GET /api/health` returns `200` in production
- [ ] M-Pesa: all four `MPESA_*` vars set, tested against sandbox first, then production shortcode approved by Safaricom
- [ ] Flutterwave: `FLUTTERWAVE_SECRET_KEY` **and** `FLUTTERWAVE_SECRET_HASH` both set, webhook URL (`/api/payments/flutterwave/webhook`) configured in the Flutterwave dashboard
- [ ] `EMAIL_OVERRIDE_TO` either unset (once real partner emails exist) or pointed at a real inbox you're checking
- [ ] Database backed up (`pg_dump`) before the first production `db:push`
- [ ] Sentry (or equivalent) wired up and receiving a test error
- [ ] Old leaked SSH key (see `.replit` git history) revoked and rotated, if not already done

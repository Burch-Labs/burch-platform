---
name: Auth system design
description: NextAuth v4 setup — what's active, what's gated, and the dev-mode behaviour for missing secrets
---

## Active providers
- Credentials (email + bcrypt password) — always enabled
- Google — loaded only when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are both set

## Email service (Resend)
- Loaded only when `RESEND_API_KEY` is set
- When absent: registration auto-verifies the user (`emailVerified = now()`), password-reset links are logged to the server console
- When present: full email verification + password-reset flow via Resend

## Secret fallback
- `NEXTAUTH_SECRET` falls back to `SESSION_SECRET` (already provisioned by Replit)

## Key files
- `apps/web/src/lib/auth.ts` — NextAuth config
- `apps/web/src/lib/email.ts` — Resend wrapper with dev fallback
- `apps/web/src/lib/tokens.ts` — token create/validate/delete helpers
- `apps/web/src/middleware.ts` — protects /dashboard, /admin, /partner; role checks for admin/partner routes

## Why auto-verify in dev
Requiring email verification without a real email service creates a dead end — users can register but never log in. Auto-verifying on registration when no email service is configured keeps the dev loop frictionless.

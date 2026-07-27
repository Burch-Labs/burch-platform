# Burch Platform

Africa's AI-Powered Experience Platform — connects people with events, hotels, restaurants, and experiences.

## Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS v4 |
| ORM | Prisma |
| Database | PostgreSQL (Replit built-in) |
| Auth | NextAuth.js v4 (JWT, credentials) |
| Monorepo | npm workspaces |

## Project structure

```
apps/
  web/          ← main Next.js app
    prisma/     ← schema + migrations
    src/
      app/      ← Next.js App Router pages & API routes
      lib/      ← prisma client, auth config
      types/    ← TypeScript augmentations
packages/       ← shared packages (to be added)
```

## Running the app

The **Start application** workflow runs `cd apps/web && npm run dev` and serves on port 5000.

Key commands (run from `apps/web/`):
```bash
npm run dev          # start dev server on :5000
npm run db:push      # sync Prisma schema → database
npm run db:studio    # open Prisma Studio
npm run build        # production build
```

## Environment variables

| Key | Notes |
|-----|-------|
| `DATABASE_URL` | Replit-managed — do not set manually |
| `NEXTAUTH_URL` | Dev domain set in `.replit` `[userenv.development]`. In production the app auto-detects from `REPLIT_DOMAINS`; set this explicitly in the production environment only if you need to override it. |
| `NEXTAUTH_SECRET` | Falls back to `SESSION_SECRET` if not set |
| `OPENAI_API_KEY` | Needed for AI features (Sprint 2+) |
| `STRIPE_SECRET_KEY` | Needed for Stripe payments |
| `MPESA_*` | Needed for M-Pesa payments |
| `RESEND_API_KEY` | Needed for transactional email |

## Post-deployment checklist (do once after first publish)

After the app is published and you have a `*.replit.app` URL:

1. **Google OAuth redirect URI** — open [Google Cloud Console → APIs & Services → Credentials](https://console.cloud.google.com/apis/credentials), select the OAuth 2.0 client, and add:
   ```
   https://<your-replit-app-url>/api/auth/callback/google
   ```
   to the **Authorised redirect URIs** list, then save.

2. **NEXTAUTH_URL (optional)** — the app auto-detects the base URL from `REPLIT_DOMAINS`, so this is only needed if you want to override it. If required, set `NEXTAUTH_URL` to `https://<your-replit-app-url>` in the Replit production environment (`.replit` → `[userenv.production]` or via Secrets).

3. **Verify email flow** — register a new account on the live URL and confirm the verification email arrives with a correct link pointing to the production domain.

## Database schema (Prisma)

Core models: `User`, `Account`, `Session`, `Partner`, `Event`, `Hotel`, `Room`, `Restaurant`, `Booking`.

To apply schema changes: `cd apps/web && npm run db:push`

## Auth

- Email/password via NextAuth credentials provider
- Registration: `POST /api/auth/register`
- Sessions: JWT strategy
- Pages: `/auth/login`, `/auth/register`

## User preferences

- Keep the monorepo structure (`apps/*`, `packages/*`)
- Use Replit's built-in PostgreSQL — do not switch to an external database
- Orange (`#e85d04`) is the brand primary colour

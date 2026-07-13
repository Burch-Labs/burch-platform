---
name: Project layout
description: Monorepo structure, stack, and how to run the app on Replit
---

## Structure
- Root: npm workspaces (`apps/*`, `packages/*`)
- Main app: `apps/web` — Next.js 15 App Router, TypeScript, Tailwind v4, Prisma
- Database: Replit's built-in PostgreSQL (env vars injected automatically — never set DATABASE_URL manually)
- Workflow: "Start application" → `cd apps/web && npm run dev` → port 5000

## Key run commands (from apps/web)
- `npm run dev` — dev server on :5000
- `npm run db:push` — sync Prisma schema to DB
- `npm run db:studio` — Prisma Studio

## Prisma schema location
`apps/web/prisma/schema.prisma` — models: User, Account, Session, Partner, Event, Hotel, Room, Restaurant, Booking, EmailVerificationToken, PasswordResetToken

## Why port 5000
Replit's webview output type requires port 5000. All Next.js dev/start scripts include `-p 5000`.

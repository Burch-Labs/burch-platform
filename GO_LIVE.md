# Going live

Everything on this branch has been built and tested against a local Postgres.
None of it has run in production. This is the list of things that are true only
once someone does them on the real environment, in the order they need doing.

`DEPLOYMENT.md` covers the standing environment-variable reference. This file is
the sequence for the first deploy of this branch specifically.

---

## 1. Secrets that must exist before first boot

`GET /api/health` returns 503 while any of these is missing, and the startup log
prints a `⚙️ dontbeboring — CONFIG CHECK` block naming them.

| Variable | Why it cannot wait |
|---|---|
| `DATABASE_URL` | Nothing starts without it. |
| `NEXTAUTH_SECRET` | Sessions. |
| `NEXTAUTH_URL` | Sign-in code emails and payment callbacks are built from this. Wrong value means codes link to localhost and M-Pesa calls back into nowhere. |
| `RESEND_API_KEY` | Sign-in codes are the only way into an account. No mail, no sign-ins. |
| `TICKET_SIGNING_SECRET` | Falls back to `NEXTAUTH_SECRET`. Set it separately, otherwise rotating the session secret silently voids every ticket already in a customer's inbox. |

Generate the two secrets with `openssl rand -base64 32` and store them where the
rest of your secrets live. Do not reuse one for both.

`DATABASE_URL` and `RESEND_API_KEY` are needed **at build time**, not only at
runtime. The home page is prerendered, so `next build` queries the database and
`next.config.ts` refuses to start without a Resend key. On a host that separates
build variables from runtime variables — Vercel does — set both in each scope, or
the deploy fails during the build with a Prisma initialisation error rather than
at boot.

## 2. Schema

The branch adds `Ticket`, `SignInCode`, `PayoutAccount` and `Club`, plus columns
on `User`, `Partner`, `Hotel`, `Restaurant`.

```bash
pg_dump "$DATABASE_URL" > backup-before-launch.sql   # do this first
cd apps/web && npx prisma db push
```

This repo uses `db push` rather than migrations. That is fine while nothing is
live and worth revisiting once real bookings exist.

**`scripts/post-merge.sh` runs `prisma db push` automatically on every merge**,
via the `postMerge` hook in `.replit`. It used to pass `--accept-data-loss`,
which meant a field removed in a pull request would silently drop that column on
whatever database the environment pointed at — bookings and payments included,
with no prompt and no backup. The flag is gone, so a destructive change now
fails the script instead. A failed deploy is recoverable in minutes; a dropped
column is not recoverable at all.

If a schema change legitimately needs to drop something, do it by hand after a
`pg_dump`, having read what the push intends to do.

## 3. Seed, carefully

`npm run db:seed` inserts the venue catalogue. It is idempotent — it skips
anything whose name already exists — so it is safe to re-run.

It seeds **no reviews, no menus and no contact details**, by design. What it does
seed is venue names, locations and descriptions, which are our research rather
than the venues' own words. Every listing lands with `verified: false` except the
ten carrying a source-checked website, and the UI says so on each one.

## 4. Payments, which cannot be verified from a laptop

Both callbacks are hardened but neither has run against a live gateway. Test
each with real money before announcing anything.

**M-Pesa.** Set all four `MPESA_*` variables and `MPESA_ENV=production`. Confirm
the Daraja callback URL is `https://<your-domain>/api/payments/mpesa/callback`.
Then buy one real ticket end to end and check:

- the booking moves to CONFIRMED,
- a Ticket row exists per seat,
- the callback was accepted — the handler now requires the amount to cover the
  booking *and* an independent confirmation from Daraja, so a misconfigured
  shortcode shows up as a payment stuck PENDING rather than a false success.

A payment stuck PENDING after a successful STK prompt means the query step is
failing. Check the logs for `could not confirm with Daraja`.

**Flutterwave.** Set `FLUTTERWAVE_SECRET_KEY` and `FLUTTERWAVE_SECRET_HASH`, and
set the webhook to `https://<your-domain>/api/payments/flutterwave/webhook`.
Without the hash the webhook rejects everything and payments only confirm via the
browser redirect — which works until a customer closes the tab.

Both paths now require the currency to match, not just the amount.

## 5. Post-deploy checks

```bash
curl https://<your-domain>/api/health          # expect 200 and "ok"
```

Then by hand:

- sign in with a code, on a real inbox;
- buy one ticket;
- scan its QR at `/api/tickets/check-in`, then scan it again — the second must
  be refused as already used;
- submit payout details as a partner, approve them at `/admin/payouts`.

## 6. Known gaps at launch

Worth deciding about rather than discovering:

- **77 of 93 listings have no booking link.** They show contact details as
  unconfirmed and offer "Claim this listing". That is honest, but it is not a
  booking funnel. Closing it is partner outreach, not code.
- **Phone sign-in is off in production** unless SMS or WhatsApp is configured.
  Someone entering a phone number gets told to use their email instead. In
  development both channels log the code to the console so the path stays
  testable, but that fallback is deliberately disabled in production.
- **WhatsApp needs a template approved by Meta before it will send anything.**
  A verification code cannot go out as an ordinary message — it must use an
  AUTHENTICATION-category template with a copy-code button, created in Meta
  Business Manager and named in `WHATSAPP_OTP_TEMPLATE`. Budget for review
  time; the credentials alone are not enough.
- **Four features are switched off** in `src/lib/features.ts`: ratings, star
  classification, menus and direct booking. Each is built and tested. Turning
  one on is a one-line change, but read the note above it first — each is off
  for a reason that has not gone away.
- **Admin is queue-driven, at `/admin`.** Payouts, partners and claims, with
  waiting counts on the tabs. There is no dashboard; the queues are the work.
- **A confirmed claim does not transfer the listing.** Marking one APPROVED
  records that we believe the claimant. Changing a real business's public
  contact details is a separate, deliberate act — not a side effect of a status
  button.

## 7. What a pre-deployment pass already confirmed

Run against a production build (`npm run build && npm run start`) on a database
dropped and rebuilt from scratch, not the dev server — dev has fallbacks that
mask exactly the problems this is looking for.

Confirmed working:

- all nine public routes return 200; the six protected ones redirect rather than
  error; an unknown listing id 404s rather than 500s;
- sign-in by emailed code creates the account and the session;
- a free ticket booking issues a Ticket row;
- the buyer can open that ticket at `/tickets`, and the QR drawn on the page was
  rasterised and decoded back to a token that still verifies — a QR that renders
  but does not scan is the failure that only this check catches;
- scanning that ticket admits once, refuses the second scan as already used, and
  rejects a forged signature — the three properties the gate depends on;
- another signed-in account, and a signed-out visitor, cannot open someone else's
  ticket page;
- an unauthenticated scan is refused outright;
- an anonymous listing claim submits and persists;
- a partner submits payout details and an admin approves them;
- all three admin queues render.

No JavaScript errors and no 5xx responses anywhere in the sweep.

Still unverifiable without live credentials, and therefore still the riskiest
part of the first deploy:

- **real email delivery** — the smoke test injects codes directly, because
  Resend needs an account. If mail is broken nobody can sign in at all;
- **M-Pesa and Flutterwave** against live gateways, per section 4;
- **WhatsApp**, which needs an approved Meta template.

One build warning is expected and benign: `resend` cannot resolve
`@react-email/render`. That module is only loaded when passing React components
to Resend, and we send HTML strings, so the code path never runs.

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

## 2. Schema

The branch adds `Ticket`, `SignInCode`, `PayoutAccount` and `Club`, plus columns
on `User`, `Partner`, `Hotel`, `Restaurant`.

```bash
pg_dump "$DATABASE_URL" > backup-before-launch.sql   # do this first
cd apps/web && npx prisma db push
```

This repo uses `db push` rather than migrations. That is fine while nothing is
live and worth revisiting once real bookings exist, because `db push` will drop
a column to match the schema without asking.

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
- **SMS is off** unless `AFRICASTALKING_*` is configured. Sign-in codes go by
  email only, which is the weaker channel in this market.
- **Four features are switched off** in `src/lib/features.ts`: ratings, star
  classification, menus and direct booking. Each is built and tested. Turning
  one on is a one-line change, but read the note above it first — each is off
  for a reason that has not gone away.
- **No admin screen for suspending a partner.** The `SUSPENDED` status works and
  stops payouts, but setting it means a database update.

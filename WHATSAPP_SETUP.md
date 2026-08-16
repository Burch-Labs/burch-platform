# WhatsApp sign-in codes — setup

The code is written and tested. What remains is Meta's onboarding, which cannot
be done from a repository — it needs a business verification and a template
review, and the review is the part with a waiting time.

## What the app actually needs

Three values, none of which is the phone number:

| Variable | What it is | Where it comes from |
|---|---|---|
| `WHATSAPP_PHONE_NUMBER_ID` | A Meta-assigned numeric ID for the sending number. **Not the number itself.** | Meta app dashboard → WhatsApp → API Setup |
| `WHATSAPP_ACCESS_TOKEN` | Bearer token for the Graph API | Same page for a 24-hour test token; a System User token for production |
| `WHATSAPP_OTP_TEMPLATE` | The *name* of an approved authentication template | Meta Business Manager → WhatsApp Manager → Message Templates |

The number you send from is configured inside Meta, not here. The startup config
check will refuse a phone number pasted into `WHATSAPP_PHONE_NUMBER_ID` and say
so, because the Graph API's own error for that mistake reads like an
authentication failure and sends people down the wrong path.

## Steps

1. **Meta Business account, verified.** Business verification is a separate
   review from template approval and is the longer of the two. Start it first.

2. **Add WhatsApp to a Meta app.** developers.facebook.com → your app → add the
   WhatsApp product. This is where API Setup lives.

3. **Register the sending number.** Important constraint: a number already
   registered to the consumer WhatsApp app or the WhatsApp Business app cannot
   be used on the API. It has to be deleted from that account first, and doing
   so ends its chat history. Many teams use a fresh number rather than lose an
   existing one — worth deciding before you register anything.

4. **Create the authentication template.** WhatsApp Manager → Message Templates
   → Create, category **Authentication**, with a **copy code** button. A
   verification code cannot be sent as a normal or marketing message; Meta
   rejects those. Name it something stable and put that name in
   `WHATSAPP_OTP_TEMPLATE`.

5. **Wait for approval**, then set the three variables and restart. Nothing else
   in the app changes — `channelsFor` starts offering WhatsApp on its own once
   all three are present.

## Verifying it works

With the variables set, request a code for a phone identifier:

```bash
curl -X POST https://<your-domain>/api/auth/request-code \
  -H "Content-Type: application/json" \
  -d '{"identifier":"<a test number>","channel":"whatsapp"}'
```

A `"channel":"whatsapp"` in the response means it was accepted for delivery. If
it comes back `"sms"` or `"email"`, WhatsApp was not available and it fell back —
check the startup config block.

## Costs

Meta bills authentication messages per message, tiered by country, since
July 2025. Sign-in codes are the highest-frequency message a platform sends, so
this is a real line item rather than a rounding error — worth modelling against
expected sign-ins before switching it on as the default channel.

## Why the number is not in this repository

A sending number is operational configuration, and this repository is shared. It
belongs in the same place as your other secrets — Replit Secrets, or your host's
environment settings — and never in a committed file. Nothing in the codebase
needs to know it: Meta resolves it from the phone number ID.

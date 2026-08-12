# AI Workforce

Every agent below runs on Anthropic's Claude via the shared framework in
`apps/web/src/lib/agents/`. Set `ANTHROPIC_API_KEY` to enable it.

- `GET /api/agents` — lists the roster (id, name, description).
- `POST /api/agents/[agentId]` — send `{ message, history? }`, get back `{ agent, text }`.
- The Concierge Agent additionally powers the customer-facing `/api/concierge`
  endpoint, which grounds its replies in live event/hotel/restaurant inventory
  and returns structured recommendations rather than plain chat text.

Add a new agent by appending an entry to the `AGENTS` array in
`apps/web/src/lib/agents/registry.ts` — no route changes needed.

## CEO Agent

Coordinates all AI agents.

---

## Booking Agent

Handles bookings and ticket purchases.

---

## Concierge Agent

Builds complete customer itineraries.

---

## Hotel Agent

Supports hotels.

---

## Restaurant Agent

Supports restaurants.

---

## Support Agent

Answers customer questions.

---

## Marketing Agent

Creates campaigns.

---

## Revenue Agent

Suggests pricing strategies.

---

## Analytics Agent

Generates reports.

---

## Fraud Agent

Detects suspicious behaviour.

---

## Developer Agent

Assists developers and platform maintenance.

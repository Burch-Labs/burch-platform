/**
 * Security properties of the ticket credential.
 *
 * These are regression tests in the strict sense: each one fails if a specific
 * attack becomes possible again. Read them as the list of things a ticket is
 * supposed to make impossible.
 */
process.env.TICKET_SIGNING_SECRET = "test-signing-secret-not-used-anywhere-real";

import { ticketToken, verifyTicketToken } from "@/lib/tickets";

describe("ticket token signing", () => {
  const ticketId = "ckticket000000000000000";

  it("accepts a token it issued itself", () => {
    expect(verifyTicketToken(ticketToken(ticketId))).toEqual({ ok: true, ticketId });
  });

  it("rejects a bare ticket id with no signature", () => {
    // The attack this blocks: reading an id off one ticket, or guessing one,
    // and presenting it alone.
    expect(verifyTicketToken(ticketId)).toEqual({ ok: false, reason: "malformed" });
  });

  it("rejects a real ticket id carrying someone else's signature", () => {
    const [, otherSignature] = ticketToken("ckticket111111111111111").split(".");
    expect(verifyTicketToken(`${ticketId}.${otherSignature}`)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("rejects a tampered signature of the correct length", () => {
    // Length-only comparison would pass this; the HMAC comparison must not.
    const [id, sig] = ticketToken(ticketId).split(".");
    const flipped = (sig[0] === "A" ? "B" : "A") + sig.slice(1);
    expect(verifyTicketToken(`${id}.${flipped}`)).toEqual({
      ok: false,
      reason: "bad-signature",
    });
  });

  it("rejects a signature produced under a different secret", () => {
    const token = ticketToken(ticketId);
    const original = process.env.TICKET_SIGNING_SECRET;
    process.env.TICKET_SIGNING_SECRET = "an-attacker-guessing-the-secret";
    try {
      // Forging requires the key, so a token signed elsewhere must not verify.
      expect(verifyTicketToken(token)).toEqual({ ok: false, reason: "bad-signature" });
    } finally {
      process.env.TICKET_SIGNING_SECRET = original;
    }
  });

  it.each([
    ["empty string", ""],
    ["dot only", "."],
    ["no signature half", `${ticketId}.`],
    ["no id half", ".somesignature"],
    ["three segments", `${ticketId}.a.b`],
  ])("rejects malformed input: %s", (_label, token) => {
    expect(verifyTicketToken(token).ok).toBe(false);
  });

  it("gives each ticket a distinct signature", () => {
    // Otherwise one valid ticket would admit every holder of any id.
    const a = ticketToken("ckticketaaaaaaaaaaaaaaa").split(".")[1];
    const b = ticketToken("ckticketbbbbbbbbbbbbbbb").split(".")[1];
    expect(a).not.toEqual(b);
  });

  it("keeps personal data out of the QR payload", () => {
    // A QR on a phone in a queue is readable over the holder's shoulder.
    const token = ticketToken(ticketId);
    expect(token).toBe(`${ticketId}.${token.split(".")[1]}`);
    expect(token).not.toMatch(/@/);
  });
});

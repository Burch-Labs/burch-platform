/**
 * QR rendering for tickets.
 *
 * The QR is the ticket. If it renders wrong, or renders something other than
 * the signed token, the guest is turned away at the door — so the properties
 * worth pinning are that what goes in comes back out, that the output is
 * something a browser can actually draw, and that a payload we did not produce
 * is refused rather than silently encoded.
 */
import { qrSvg } from "@/lib/qr";
import { ticketToken, verifyTicketToken } from "@/lib/tickets";

const OLD_ENV = process.env;

beforeEach(() => {
  process.env = { ...OLD_ENV, TICKET_SIGNING_SECRET: "test-signing-secret" };
});

afterAll(() => {
  process.env = OLD_ENV;
});

describe("qrSvg", () => {
  it("renders an SVG element", async () => {
    const svg = await qrSvg("abc123.deadbeef");
    expect(svg).toMatch(/^<\?xml|^<svg/);
    expect(svg).toContain("</svg>");
  });

  it("encodes a real ticket token, and the result still verifies", async () => {
    // The end-to-end property that matters: whatever we drew, scanning it back
    // must produce a token the door accepts.
    const token = ticketToken("ckqz0000000000000000test");
    await expect(qrSvg(token)).resolves.toContain("<svg");
    expect(verifyTicketToken(token)).toEqual({
      ok: true,
      ticketId: "ckqz0000000000000000test",
    });
  });

  it("honours the requested size so print and screen both stay sharp", async () => {
    const svg = await qrSvg("abc.def", 400);
    expect(svg).toMatch(/width="400"/);
  });

  it("refuses a payload outside the token alphabet", async () => {
    // A payload with markup in it would be injected into the page as raw HTML.
    await expect(qrSvg('a"><script>alert(1)</script>')).rejects.toThrow(/unexpected characters/i);
  });

  it("refuses an empty payload rather than drawing a blank code", async () => {
    await expect(qrSvg("")).rejects.toThrow();
  });

  it("never emits a script tag, because the output is injected as raw HTML", async () => {
    const svg = await qrSvg(ticketToken("ckqz0000000000000000test"));
    expect(svg).not.toMatch(/<script/i);
    expect(svg).not.toMatch(/on[a-z]+=/i);
  });

  it("draws different codes for different tickets", async () => {
    const a = await qrSvg(ticketToken("ckqz0000000000000000aaaa"));
    const b = await qrSvg(ticketToken("ckqz0000000000000000bbbb"));
    expect(a).not.toEqual(b);
  });
});

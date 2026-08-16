/**
 * SMS number handling and failure behaviour.
 *
 * The delivery itself needs a live Africa's Talking account, so what is worth
 * pinning here is everything around it: that Kenyan numbers in the shapes
 * people actually type all reach the same E.164 form, and that a failure
 * returns rather than throws — a dead SMS gateway must not take a sign-in
 * attempt down with it.
 */
import { toE164, signInCodeSms, sendSms } from "@/lib/sms";

describe("toE164", () => {
  it.each([
    ["local with leading zero", "0712345678"],
    ["spaced as people write it", "0712 345 678"],
    ["already international", "254712345678"],
    ["with a plus", "+254712345678"],
    ["bare subscriber number", "712345678"],
    ["hyphenated", "0712-345-678"],
  ])("normalises %s", (_label, input) => {
    expect(toE164(input)).toBe("+254712345678");
  });

  it("handles the Safaricom 01 range", () => {
    expect(toE164("0110123456")).toBe("+254110123456");
  });

  it.each([
    ["too short", "0712345"],
    ["too long", "07123456789"],
    ["not a Kenyan mobile prefix", "0312345678"],
    ["empty", ""],
    ["letters", "not a number"],
  ])("rejects %s rather than sending somewhere wrong", (_label, input) => {
    expect(toE164(input)).toBeNull();
  });
});

describe("signInCodeSms", () => {
  it("leads with the code so it is visible in a notification preview", () => {
    expect(signInCodeSms("482913", 10)).toMatch(/^482913/);
  });

  it("warns against sharing it", () => {
    expect(signInCodeSms("482913", 10)).toMatch(/not share/i);
  });

  it("fits one SMS segment", () => {
    // Over 160 GSM-7 characters bills as two messages, on every code sent.
    expect(signInCodeSms("482913", 10).length).toBeLessThanOrEqual(160);
  });
});

describe("sendSms without credentials", () => {
  it("reports not-configured rather than throwing", async () => {
    // Sign-in must survive an unconfigured or broken gateway.
    await expect(sendSms("0712345678", "hello")).resolves.toEqual({
      sent: false,
      reason: "not-configured",
    });
  });

  it("rejects a bad number before reaching the provider", async () => {
    await expect(sendSms("nonsense", "hello")).resolves.toEqual({
      sent: false,
      reason: "invalid-number",
    });
  });
});

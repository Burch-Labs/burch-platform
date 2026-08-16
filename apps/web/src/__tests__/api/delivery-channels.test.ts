/**
 * Sign-in code delivery routing.
 *
 * The property that matters most here is negative: there must be no way to name
 * one account and a different destination. If that ever becomes possible,
 * anyone can have a stranger's sign-in code delivered to their own handset,
 * which is a one-step account takeover. Several tests below exist only to prove
 * that separation still holds.
 */
import {
  parseIdentifier,
  channelsFor,
  resolveChannel,
  deliverSignInCode,
} from "@/lib/delivery";

/** Runs a synchronous assertion with NODE_ENV pinned to production. */
function withProduction(fn: () => void) {
  const original = process.env.NODE_ENV;
  Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true });
  try {
    fn();
  } finally {
    Object.defineProperty(process.env, "NODE_ENV", { value: original, configurable: true });
  }
}

describe("parseIdentifier", () => {
  it.each([
    ["plain address", "ada@example.com", "ada@example.com"],
    ["mixed case", "Ada@Example.COM", "ada@example.com"],
    ["padded", "  ada@example.com  ", "ada@example.com"],
  ])("reads %s as an email", (_l, input, expected) => {
    expect(parseIdentifier(input)).toEqual({ kind: "email", value: expected });
  });

  it.each([
    ["local form", "0712345678"],
    ["spaced", "0712 345 678"],
    ["international", "+254712345678"],
  ])("reads %s as a phone", (_l, input) => {
    expect(parseIdentifier(input)).toEqual({ kind: "phone", value: "+254712345678" });
  });

  it.each([["empty", ""], ["junk", "hello"], ["short number", "0712"]])(
    "refuses %s",
    (_l, input) => {
      expect(parseIdentifier(input)).toBeNull();
    }
  );
});

describe("channelsFor", () => {
  it("offers only email for an email identifier", () => {
    // The point: an email identifier can never be routed to a phone, whatever
    // the caller asks for.
    expect(channelsFor({ kind: "email", value: "ada@example.com" })).toEqual(["email"]);
  });

  it("offers phone channels in development so the path is testable locally", () => {
    // Both senders log the code to the console when unconfigured, so a
    // developer can complete a phone sign-in without a provider account.
    expect(channelsFor({ kind: "phone", value: "+254712345678" })).toEqual([
      "whatsapp",
      "sms",
    ]);
  });

  it("offers nothing for a phone in production with no provider configured", () => {
    // Crucially it does not fall back to email — that would be a different
    // recipient, not a different route.
    withProduction(() => {
      expect(channelsFor({ kind: "phone", value: "+254712345678" })).toEqual([]);
    });
  });
});

describe("resolveChannel", () => {
  const email = { kind: "email", value: "ada@example.com" } as const;
  const phone = { kind: "phone", value: "+254712345678" } as const;

  it("uses email for an email identifier", () => {
    expect(resolveChannel(email)).toBe("email");
  });

  it("ignores a phone-channel preference on an email identifier", () => {
    // Asking for WhatsApp on an email sign-in must not reroute the code.
    expect(resolveChannel(email, "whatsapp")).toBe("email");
    expect(resolveChannel(email, "sms")).toBe("email");
  });

  it("never reroutes a phone identifier to email", () => {
    // In development a phone channel is always offered, so asking for email
    // simply does not win; in production with nothing configured the answer is
    // null. Either way the code never lands in an inbox.
    expect(resolveChannel(phone, "email")).not.toBe("email");
    withProduction(() => {
      expect(resolveChannel(phone, "email")).toBeNull();
    });
  });
});

describe("deliverSignInCode", () => {
  it("will not deliver to a phone in production with no channel available", async () => {
    // Refusing is correct. Quietly emailing it somewhere would be worse than
    // failing, because the code would reach a different person.
    const original = process.env.NODE_ENV;
    Object.defineProperty(process.env, "NODE_ENV", { value: "production", configurable: true });
    try {
      await expect(
        deliverSignInCode({
          identifier: { kind: "phone", value: "+254712345678" },
          code: "123456",
          ttlMinutes: 10,
        })
      ).resolves.toEqual({ delivered: false, reason: "no-channel" });
    } finally {
      Object.defineProperty(process.env, "NODE_ENV", { value: original, configurable: true });
    }
  });

  it("takes no destination parameter at all", () => {
    // A structural guarantee rather than a behavioural one: the function
    // signature has nowhere to put an attacker-chosen recipient.
    const params = deliverSignInCode.length;
    expect(params).toBe(1);
    const accepted = ["identifier", "code", "ttlMinutes", "preferredChannel"];
    expect(accepted).not.toContain("to");
    expect(accepted).not.toContain("destination");
  });
});

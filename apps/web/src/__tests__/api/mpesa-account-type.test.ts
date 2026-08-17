/**
 * Till vs PayBill transaction type.
 *
 * Safaricom rejects — or worse, silently accepts but never delivers to the
 * merchant — an STK push sent with the wrong TransactionType for the account
 * behind it. A PayBill needs CustomerPayBillOnline; a Till (Buy Goods) needs
 * CustomerBuyGoodsOnline. Getting this wrong against a real account is a real
 * payment that never reaches anyone, so this pins the mapping directly rather
 * than trusting it by inspection.
 */
const OLD_ENV = process.env;

function mockFetchOnce(body: unknown) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  }) as unknown as typeof fetch;
}

beforeEach(() => {
  jest.resetModules();
  process.env = {
    ...OLD_ENV,
    MPESA_CONSUMER_KEY: "key",
    MPESA_CONSUMER_SECRET: "secret",
    MPESA_PASSKEY: "passkey",
    MPESA_SHORTCODE: "174379",
  };
});

afterAll(() => {
  process.env = OLD_ENV;
});

async function pushAndCaptureBody() {
  const oauthCall = { ok: true, json: async () => ({ access_token: "tok", expires_in: "3600" }) };
  const stkCall = {
    ok: true,
    json: async () => ({
      MerchantRequestID: "m1",
      CheckoutRequestID: "c1",
      ResponseCode: "0",
      CustomerMessage: "ok",
    }),
  };
  const fetchMock = jest
    .fn()
    .mockResolvedValueOnce(oauthCall)
    .mockResolvedValueOnce(stkCall);
  global.fetch = fetchMock as unknown as typeof fetch;

  const { stkPush } = await import("@/lib/payments/mpesa");
  await stkPush({
    phone: "254712345678",
    amount: 100,
    accountReference: "ORDER1",
    transactionDesc: "Ticket",
    callbackUrl: "https://example.com/cb",
  });

  const stkCallArgs = fetchMock.mock.calls[1];
  return JSON.parse(stkCallArgs[1].body);
}

describe("MPESA_ACCOUNT_TYPE", () => {
  it("defaults to PayBill when unset", async () => {
    const body = await pushAndCaptureBody();
    expect(body.TransactionType).toBe("CustomerPayBillOnline");
  });

  it("uses CustomerPayBillOnline when explicitly set to paybill", async () => {
    process.env.MPESA_ACCOUNT_TYPE = "paybill";
    const body = await pushAndCaptureBody();
    expect(body.TransactionType).toBe("CustomerPayBillOnline");
  });

  it("uses CustomerBuyGoodsOnline for a till account", async () => {
    process.env.MPESA_ACCOUNT_TYPE = "till";
    const body = await pushAndCaptureBody();
    expect(body.TransactionType).toBe("CustomerBuyGoodsOnline");
  });

  it("sends the same shortcode as PartyB for a till account", async () => {
    // A Till's business shortcode IS the till number itself — unlike PayBill,
    // there's no separate account number field for Daraja to route on.
    process.env.MPESA_ACCOUNT_TYPE = "till";
    const body = await pushAndCaptureBody();
    expect(body.PartyB).toBe(process.env.MPESA_SHORTCODE);
    expect(body.BusinessShortCode).toBe(process.env.MPESA_SHORTCODE);
  });

  it("falls back to paybill for an unrecognized value rather than guessing", async () => {
    process.env.MPESA_ACCOUNT_TYPE = "buy-goods";
    const body = await pushAndCaptureBody();
    expect(body.TransactionType).toBe("CustomerPayBillOnline");
  });
});

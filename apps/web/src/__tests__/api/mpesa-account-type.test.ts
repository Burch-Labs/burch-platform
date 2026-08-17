/**
 * STK Push TransactionType.
 *
 * Despite the field name implying it varies by account, Safaricom's M-Pesa
 * Express (STK Push) endpoint only accepts CustomerPayBillOnline — confirmed
 * directly against a real Till (Buy Goods) account, which rejected
 * CustomerBuyGoodsOnline with "Bad Request - Invalid TransactionType". This
 * pins that down so a future "fix" doesn't reintroduce a value that looks
 * more correct by name than it is by behavior.
 */
const OLD_ENV = process.env;

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

describe("STK Push TransactionType", () => {
  it("always sends CustomerPayBillOnline, PayBill or Till alike", async () => {
    const body = await pushAndCaptureBody();
    expect(body.TransactionType).toBe("CustomerPayBillOnline");
  });

  it("sends the configured shortcode as both PartyB and BusinessShortCode", async () => {
    // A Till's business shortcode IS the till number itself — unlike PayBill,
    // there's no separate account number field for Daraja to route on — so
    // this must hold regardless of which kind of account it is.
    const body = await pushAndCaptureBody();
    expect(body.PartyB).toBe(process.env.MPESA_SHORTCODE);
    expect(body.BusinessShortCode).toBe(process.env.MPESA_SHORTCODE);
  });
});

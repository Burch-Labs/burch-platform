/**
 * Unit tests for guest confirmation emails (src/lib/email.ts)
 *
 * Covers:
 *  - Hotel confirmation email contains a "View booking" link to /dashboard/bookings
 *    and cancel/manage wording
 *  - Restaurant confirmation email contains a "View reservation" link to
 *    /dashboard/bookings and manage wording
 *
 * email.ts reads env vars at module-load time, so each scenario re-requires the
 * module inside jest.isolateModules() with a controlled environment.
 */

type EmailModule = typeof import("../../lib/email");

const sendMock = jest.fn().mockResolvedValue({ id: "test" });

jest.mock("resend", () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: { send: sendMock },
  })),
}));

function loadEmailModule(): EmailModule {
  let mod: EmailModule;
  jest.isolateModules(() => {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    mod = require("../../lib/email");
  });
  return mod!;
}

const ENV_KEYS = ["RESEND_API_KEY", "NEXTAUTH_URL", "REPLIT_DOMAINS", "EMAIL_OVERRIDE_TO"];
const saved: Record<string, string | undefined> = {};

beforeEach(() => {
  sendMock.mockClear();
  for (const k of ENV_KEYS) saved[k] = process.env[k];
  process.env.RESEND_API_KEY = "re_test_key";
  process.env.NEXTAUTH_URL = "https://example.test";
  delete process.env.EMAIL_OVERRIDE_TO;
});

afterEach(() => {
  for (const k of ENV_KEYS) {
    if (saved[k] === undefined) delete process.env[k];
    else process.env[k] = saved[k];
  }
});

describe("sendGuestHotelConfirmation", () => {
  it("includes a View booking link to /dashboard/bookings and cancel wording", async () => {
    const email = loadEmailModule();
    await email.sendGuestHotelConfirmation({
      guestEmail: "guest@example.com",
      guestName: "Amina",
      propertyName: "Savanna Lodge",
      checkIn: new Date("2026-09-01T12:00:00Z"),
      checkOut: new Date("2026-09-03T10:00:00Z"),
      nights: 2,
      totalAmount: 300,
      currency: "USD",
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const { html } = sendMock.mock.calls[0][0];
    expect(html).toContain("https://example.test/dashboard/bookings");
    expect(html).toContain("View booking");
    expect(html.toLowerCase()).toContain("cancel");
  });
});

describe("sendGuestReservationConfirmation", () => {
  it("includes a View reservation link to /dashboard/bookings and manage wording", async () => {
    const email = loadEmailModule();
    await email.sendGuestReservationConfirmation({
      guestEmail: "guest@example.com",
      guestName: "Kwame",
      restaurantName: "Baobab Bistro",
      dateTime: new Date("2026-09-05T19:00:00Z"),
      partySize: 2,
    });

    expect(sendMock).toHaveBeenCalledTimes(1);
    const { html } = sendMock.mock.calls[0][0];
    expect(html).toContain("https://example.test/dashboard/bookings");
    expect(html).toContain("View reservation");
    expect(html.toLowerCase()).toContain("cancel");
  });
});

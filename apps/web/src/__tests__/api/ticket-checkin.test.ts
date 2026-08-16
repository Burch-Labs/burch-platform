/**
 * Single-use enforcement at the gate.
 *
 * A signature proves a ticket is genuine; it says nothing about whether the
 * holder already walked in. These tests cover the second half: one admission
 * per ticket, no matter how many times the code is presented or how many
 * scanners present it at once.
 */
process.env.TICKET_SIGNING_SECRET = "test-signing-secret-not-used-anywhere-real";

const mockFindUnique = jest.fn();
const mockUpdateMany = jest.fn();

jest.mock("@/lib/prisma", () => ({
  prisma: {
    ticket: {
      findUnique: (...a: unknown[]) => mockFindUnique(...a),
      updateMany: (...a: unknown[]) => mockUpdateMany(...a),
    },
  },
}));

import { checkInTicket, ticketToken } from "@/lib/tickets";

const TICKET_ID = "ckticket000000000000000";
const EVENT_ID = "ckevent0000000000000000";

const validTicket = {
  id: TICKET_ID,
  eventId: EVENT_ID,
  status: "VALID" as const,
  serial: 2,
  attendeeName: "Wanjiru K.",
  checkedInAt: null,
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe("checkInTicket", () => {
  it("admits a genuine, unused ticket and reports who it names", async () => {
    mockFindUnique.mockResolvedValueOnce(validTicket);
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({
      status: "admitted",
      ticket: { id: TICKET_ID, serial: 2, attendeeName: "Wanjiru K." },
    });
  });

  it("claims the ticket conditionally on it still being VALID", async () => {
    // This is the whole defence against a double scan. If the update were
    // unconditional, two simultaneous scans would both succeed.
    mockFindUnique.mockResolvedValueOnce(validTicket);
    mockUpdateMany.mockResolvedValueOnce({ count: 1 });

    await checkInTicket({ token: ticketToken(TICKET_ID), eventId: EVENT_ID, scannedBy: "s" });

    expect(mockUpdateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: TICKET_ID, status: "VALID" },
      })
    );
  });

  it("refuses a second scan of the same ticket", async () => {
    const checkedInAt = new Date("2026-08-16T18:30:00Z");
    mockFindUnique
      .mockResolvedValueOnce({ ...validTicket, status: "CHECKED_IN", checkedInAt })
      .mockResolvedValueOnce({ checkedInAt });
    // Nothing matches `status: VALID`, so the conditional update claims nothing.
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({ status: "already-used", checkedInAt });
  });

  it("refuses the loser of a simultaneous double scan", async () => {
    // Both scanners saw VALID; only one update can match.
    mockFindUnique.mockResolvedValueOnce(validTicket).mockResolvedValueOnce({ checkedInAt: null });
    mockUpdateMany.mockResolvedValueOnce({ count: 0 });

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "gate-b",
    });

    expect(result.status).toBe("already-used");
  });

  it("refuses a valid ticket presented at the wrong event", async () => {
    mockFindUnique.mockResolvedValueOnce({ ...validTicket, eventId: "some-other-event" });

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({ status: "wrong-event" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a voided ticket", async () => {
    mockFindUnique.mockResolvedValueOnce({ ...validTicket, status: "VOID" });

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({ status: "void" });
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("refuses a forged token without touching the database", async () => {
    const result = await checkInTicket({
      token: `${TICKET_ID}.forged-signature`,
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({ status: "invalid" });
    expect(mockFindUnique).not.toHaveBeenCalled();
    expect(mockUpdateMany).not.toHaveBeenCalled();
  });

  it("reports a signed ticket that no longer exists as not-found", async () => {
    mockFindUnique.mockResolvedValueOnce(null);

    const result = await checkInTicket({
      token: ticketToken(TICKET_ID),
      eventId: EVENT_ID,
      scannedBy: "organiser-1",
    });

    expect(result).toEqual({ status: "not-found" });
  });
});

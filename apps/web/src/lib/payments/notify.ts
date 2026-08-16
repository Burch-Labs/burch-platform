import { after } from "next/server";
import { sendGuestEventConfirmation, sendPartnerBookingNotification } from "@/lib/email";
import type { BookingWithContext } from "./ledger";

/**
 * Fires the guest confirmation + partner notification emails for a confirmed
 * event booking. Shared by the free-ticket path and every paid-payment
 * success path (M-Pesa callback, Flutterwave webhook) so there's one place
 * that defines "what happens when an event booking is confirmed."
 */
export function notifyEventBookingConfirmed(booking: BookingWithContext): void {
  const { id: bookingId, event, user, quantity, totalAmount, currency } = booking;
  if (!event) return;

  const partnerUser = event.partner?.user;
  if (partnerUser?.email) {
    const dateLabel = event.startDate.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const timeLabel = event.startDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
    after(() =>
      sendPartnerBookingNotification({
        partnerEmail: partnerUser.email,
        partnerName: partnerUser.name ?? "Partner",
        guestName: user.name ?? user.email ?? "A guest",
        propertyName: event.title,
        propertyType: "event",
        bookingDetail: `${quantity} ticket${quantity !== 1 ? "s" : ""} · ${dateLabel} at ${timeLabel}`,
      }).catch((err) => console.error("[partner-notify] event booking email failed:", err))
    );
  }

  if (user.email) {
    const guestEmail = user.email;
    after(() =>
      sendGuestEventConfirmation({
        guestEmail,
        guestName: user.name ?? guestEmail,
        eventTitle: event.title,
        eventDate: event.startDate,
        quantity,
        totalAmount: Number(totalAmount),
        currency,
        bookingId,
      }).catch((err) => console.error("[guest-confirm] event booking email failed:", err))
    );
  }
}

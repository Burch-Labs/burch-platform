import Link from "next/link";
import type { PayoutStatus } from "@prisma/client";

interface PayoutStatusCardProps {
  status: PayoutStatus | null;
  rejectionReason?: string | null;
}

/**
 * Tells a partner where they stand on getting paid.
 *
 * Sits on the partner dashboard because the alternative — discovering at payout
 * time that verification was never done — turns a five-minute form into an
 * angry support ticket on the day they expected money. Each state says what
 * happens next rather than only what is wrong.
 */
export function PayoutStatusCard({ status, rejectionReason }: PayoutStatusCardProps) {
  const view = {
    tone: "neutral" as "neutral" | "good" | "warn" | "bad",
    title: "",
    body: "",
    cta: null as { href: string; label: string } | null,
  };

  switch (status) {
    case "VERIFIED":
      view.tone = "good";
      view.title = "Payouts are active";
      view.body = "Your details are verified. Ticket revenue is released on the normal schedule.";
      break;
    case "SUBMITTED":
      view.tone = "neutral";
      view.title = "Details under review";
      view.body =
        "We are checking your payout details. You can keep listing and selling in the meantime — revenue is held until the check clears.";
      break;
    case "REJECTED":
      view.tone = "bad";
      view.title = "Payout details not accepted";
      view.body =
        rejectionReason?.trim() ||
        "Something did not check out. Update your details and submit again.";
      view.cta = { href: "/partner/payouts", label: "Update details" };
      break;
    case "UNVERIFIED":
    case null:
    default:
      view.tone = "warn";
      view.title = "Add your payout details";
      view.body =
        "You can list and sell right away. Before we can release any money to you, we need to confirm who you are.";
      view.cta = { href: "/partner/payouts", label: "Add payout details" };
      break;
  }

  const tones = {
    good:    "bg-green-50 border-green-200 text-green-800",
    neutral: "bg-gray-50 border-gray-200 text-gray-700",
    warn:    "bg-orange-50 border-orange-200 text-orange-800",
    bad:     "bg-red-50 border-red-200 text-red-800",
  };

  return (
    <div className={`mb-6 rounded-xl border px-5 py-4 ${tones[view.tone]}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">{view.title}</p>
          <p className="text-sm mt-0.5 opacity-90">{view.body}</p>
        </div>
        {view.cta && (
          <Link
            href={view.cta.href}
            className="flex-shrink-0 text-sm font-semibold underline underline-offset-2 hover:no-underline"
          >
            {view.cta.label}
          </Link>
        )}
      </div>
    </div>
  );
}

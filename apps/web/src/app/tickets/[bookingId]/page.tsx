import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { ticketToken, referenceCode } from "@/lib/tickets";
import { qrSvg } from "@/lib/qr";
import { LogoMark } from "@/components/layout/Logo";
import { CATEGORY_LABELS } from "@/types/events";
import { DownloadTicketsButton } from "./DownloadTicketsButton";

export const metadata = { title: "Your tickets — dontbeboringKE" };

/**
 * A ticket carries a live credential, so this page must never be cached or
 * prerendered — a stored copy is a stored key.
 */
export const dynamic = "force-dynamic";

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-KE", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function fmtTime(d: Date) {
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit" });
}

export default async function TicketWalletPage({
  params,
}: {
  params: Promise<{ bookingId: string }>;
}) {
  const { bookingId } = await params;

  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/login");

  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    select: {
      id: true,
      userId: true,
      status: true,
      currency: true,
      totalAmount: true,
      event: {
        select: {
          id: true,
          title: true,
          location: true,
          city: true,
          startDate: true,
          category: true,
          partner: { select: { name: true } },
        },
      },
      tickets: {
        orderBy: { serial: "asc" },
        select: { id: true, serial: true, status: true, attendeeName: true, checkedInAt: true },
      },
    },
  });

  if (!booking || !booking.event) notFound();

  // Someone else's booking is a 404, not a 403 — confirming that a booking id
  // exists tells a stranger something they have no business knowing.
  if (booking.userId !== session.user.id) notFound();

  const { event } = booking;

  // Sign every ticket up front so the render below stays synchronous.
  const tickets = await Promise.all(
    booking.tickets.map(async (t) => ({
      ...t,
      svg: t.status === "VALID" ? await qrSvg(ticketToken(t.id), 240) : null,
      ref: referenceCode(t.id),
    }))
  );

  const total = tickets.length;

  // Plenty of registered business names end in a full stop ("Events Co."), and
  // the sentence below adds its own.
  const organiser = event.partner?.name?.replace(/\.\s*$/, "") ?? null;

  return (
    <div className="min-h-screen bg-[#0C0E13] print:bg-white">
      <main className="max-w-2xl mx-auto px-4 py-10 print:py-0">
        <div className="flex items-center justify-between mb-6 print:hidden">
          <Link href="/tickets" className="text-xs font-medium text-orange-300 hover:text-orange-200">
            ← All tickets
          </Link>
          <div className="flex items-center gap-4">
            <p className="text-xs text-gray-400">
              {total} ticket{total !== 1 ? "s" : ""}
            </p>
            {total > 0 && <DownloadTicketsButton />}
          </div>
        </div>

        {booking.status !== "CONFIRMED" && (
          <div className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 px-4 py-3 print:hidden">
            <p className="text-sm font-medium text-amber-200">
              This booking is {booking.status.toLowerCase()}.
            </p>
            <p className="text-xs text-amber-200/70 mt-0.5">
              Tickets are only admitted once payment has cleared.
            </p>
          </div>
        )}

        <div className="space-y-6">
          {tickets.map((t) => (
            <article
              key={t.id}
              className="rounded-[22px] bg-white shadow-[0_30px_60px_-20px_rgba(15,26,46,0.35),0_4px_16px_-4px_rgba(15,26,46,0.15)] print:shadow-none print:border print:border-gray-200 print:break-inside-avoid"
            >
              {/* ── Stub: the part staff look at ── */}
              <div className="relative overflow-hidden rounded-t-[22px] bg-[radial-gradient(140%_100%_at_0%_0%,rgba(234,88,12,0.55),transparent_60%),linear-gradient(155deg,#0F1A2E_0%,#0A1220_68%)] px-6 py-6 print:bg-white print:border-b print:border-gray-200">
                {/* Faint diagonal watermark — hidden on print, where it would just waste ink */}
                <div
                  aria-hidden
                  className="absolute inset-[-20%_-10%] opacity-[0.07] print:hidden"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(115deg, transparent 0 42px, rgba(255,255,255,0.5) 42px 43px, transparent 43px 84px)",
                  }}
                />
                <div className="relative flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5">
                    <LogoMark className="h-[19.5px] w-[26px] text-orange-500 print:text-orange-700" />
                    <span className="font-display font-semibold text-sm text-[#F4E9DA] print:text-gray-900 flex items-center gap-1">
                      dontbeboring
                      <span className="font-sans text-[8px] font-extrabold bg-orange-600 text-white rounded px-1 py-0.5">
                        KE
                      </span>
                    </span>
                  </div>
                  <span className="text-[10px] font-bold tracking-wider uppercase text-[#D8A24A] border border-[#D8A24A]/45 rounded-full px-2.5 py-0.5 print:text-orange-700 print:border-orange-300">
                    {CATEGORY_LABELS[event.category]}
                  </span>
                </div>
                <h1 className="relative font-display text-2xl text-white mt-2 leading-tight print:text-gray-900">
                  {event.title}
                </h1>
                <div className="relative mt-3.5 flex flex-col gap-1">
                  <p className="flex items-baseline gap-2 text-[12.5px] text-[#C9D2E3] print:text-gray-600">
                    <span className="text-[10px] font-bold tracking-wider text-[#D8A24A] w-11 flex-shrink-0 print:text-orange-700">DATE</span>
                    {fmtDate(event.startDate)} · {fmtTime(event.startDate)}
                  </p>
                  <p className="flex items-baseline gap-2 text-[12.5px] text-[#C9D2E3] print:text-gray-600">
                    <span className="text-[10px] font-bold tracking-wider text-[#D8A24A] w-11 flex-shrink-0 print:text-orange-700">VENUE</span>
                    {event.location}
                    {event.city ? `, ${event.city}` : ""}
                  </p>
                </div>
              </div>

              {/* ── Perforation: the logo's spark-in-the-tear-line, made physical ── */}
              <div className="relative h-7 print:hidden">
                <span className="absolute top-1/2 -left-3 -translate-y-1/2 h-6 w-6 rounded-full bg-[#0C0E13]" />
                <span className="absolute top-1/2 -right-3 -translate-y-1/2 h-6 w-6 rounded-full bg-[#0C0E13]" />
                <span
                  className="absolute top-1/2 left-7 right-7 h-px -translate-y-1/2"
                  style={{ backgroundImage: "repeating-linear-gradient(to right, #E4DED0 0 6px, transparent 6px 11px)" }}
                />
                <svg viewBox="0 0 24 24" className="absolute top-1/2 left-1/2 h-[15px] w-[15px] -translate-x-1/2 -translate-y-1/2 text-orange-600">
                  <path
                    fill="currentColor"
                    d="M12 2 L14.6 9.4 L22 12 L14.6 14.6 L12 22 L9.4 14.6 L2 12 L9.4 9.4 Z"
                  />
                </svg>
              </div>
              <div className="hidden print:block border-t border-dashed border-gray-300" />

              {/* ── The code ── */}
              <div className="px-6 py-6 flex flex-col items-center">
                {t.svg ? (
                  <>
                    <div className="relative w-[216px] h-[216px] p-2.5 bg-white rounded-2xl border border-gray-100">
                      <div
                        className="w-full h-full [&>svg]:w-full [&>svg]:h-full"
                        /* Generated by the QR encoder from a token we produced and
                           charset-validated; it contains no author-supplied markup. */
                        dangerouslySetInnerHTML={{ __html: t.svg }}
                      />
                      <span className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-orange-500/60 rounded-tl-md print:hidden" />
                      <span className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-orange-500/60 rounded-tr-md print:hidden" />
                      <span className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-orange-500/60 rounded-bl-md print:hidden" />
                      <span className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-orange-500/60 rounded-br-md print:hidden" />
                    </div>
                    <p className="mt-3.5 font-mono text-[12.5px] tracking-[0.14em] text-gray-900 bg-gray-50 rounded-lg px-3.5 py-1.5">
                      REF&nbsp;&nbsp;{t.ref}
                    </p>
                    <p className="mt-2.5 text-xs text-gray-400 text-center max-w-xs">
                      Show this at the door. A screenshot works. Each code admits one
                      person, once.
                    </p>
                  </>
                ) : (
                  <div className="w-[216px] h-[216px] rounded-xl bg-gray-50 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center px-6">
                    <p className="text-sm font-semibold text-gray-700">
                      {t.status === "CHECKED_IN" ? "Already used" : "Not valid"}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {t.status === "CHECKED_IN" && t.checkedInAt
                        ? `Admitted ${fmtDate(t.checkedInAt)} at ${fmtTime(t.checkedInAt)}`
                        : "This ticket was cancelled. Contact the organiser."}
                    </p>
                  </div>
                )}
              </div>

              {/* ── Details ── */}
              <div className="border-t border-gray-100 px-6 py-4 grid grid-cols-[1fr_1fr_auto] gap-3.5 items-center">
                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold tracking-wider text-gray-400">
                    ADMIT
                  </p>
                  <p className="text-[13.5px] font-semibold text-gray-900 truncate">
                    {t.attendeeName ?? session.user.name ?? "Guest"}
                  </p>
                </div>
                <div className="min-w-0">
                  <p className="text-[9.5px] font-bold tracking-wider text-gray-400">
                    TICKET
                  </p>
                  <p className="text-[13.5px] font-semibold text-gray-900">
                    {t.serial} of {total}
                  </p>
                </div>
                <div
                  className="h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 print:hidden"
                  style={{ backgroundImage: "conic-gradient(from 180deg, #D8A24A, #F4E1B8, #D8A24A)" }}
                >
                  <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] text-[#0A1220]">
                    <path
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M8 12.5 L10.8 15.3 L16.5 9"
                    />
                  </svg>
                </div>
              </div>

              {/* ── Security line ── */}
              <div className="bg-gray-50 px-6 py-2.5 flex items-center gap-2 print:hidden">
                <svg viewBox="0 0 24 24" className="h-[13px] w-[13px] text-orange-600 flex-shrink-0">
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinejoin="round"
                    d="M12 2 L20 5.5 V11 C20 16 16.5 20.2 12 22 C7.5 20.2 4 16 4 11 V5.5 Z"
                  />
                  <path
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M8.5 12 L11 14.5 L16 9"
                  />
                </svg>
                <p className="text-[10.5px] text-gray-400 leading-relaxed">
                  Cryptographically signed · No personal data encoded · First scan admits, every later scan is refused
                </p>
              </div>

              <div className="rounded-b-[22px] bg-gray-50 px-6 py-3 print:bg-white">
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Issued by dontbeboringKE
                  {organiser ? ` on behalf of ${organiser}` : ""}. Booking {booking.id}.
                </p>
              </div>
            </article>
          ))}
        </div>

        {tickets.length === 0 && (
          <div className="rounded-2xl bg-white px-6 py-14 text-center">
            <p className="text-sm font-medium text-gray-700">No tickets on this booking yet.</p>
            <p className="text-xs text-gray-400 mt-1">
              Tickets are issued the moment payment clears. If you have paid, give it a
              minute and refresh.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

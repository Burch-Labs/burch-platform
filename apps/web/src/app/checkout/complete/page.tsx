import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";

interface PageProps {
  searchParams: Promise<{ result?: string; booking?: string }>;
}

const COPY: Record<string, { title: string; body: string; tone: string }> = {
  success: {
    title: "Payment confirmed!",
    body: "Your ticket is booked. A confirmation email is on its way.",
    tone: "border-green-200 bg-green-50 text-green-800",
  },
  failed: {
    title: "Payment didn't go through",
    body: "The transaction was cancelled or declined. No charge was made — you can try again from the event page.",
    tone: "border-red-200 bg-red-50 text-red-800",
  },
  pending: {
    title: "Still confirming…",
    body: "We're waiting on final confirmation from the payment provider. Check My Bookings shortly — this usually resolves within a minute.",
    tone: "border-amber-200 bg-amber-50 text-amber-800",
  },
  error: {
    title: "Something went wrong",
    body: "We couldn't find that payment. If money left your account, it will be refunded automatically — contact support if it isn't reversed within a few days.",
    tone: "border-gray-200 bg-gray-50 text-gray-800",
  },
};

export default async function CheckoutCompletePage({ searchParams }: PageProps) {
  const { result } = await searchParams;
  const copy = COPY[result ?? "error"] ?? COPY.error;

  return (
    <>
      <NavBar />
      <main className="max-w-lg mx-auto px-4 py-16">
        <div className={`rounded-2xl border p-8 text-center ${copy.tone}`}>
          <h1 className="text-xl font-semibold mb-2">{copy.title}</h1>
          <p className="text-sm leading-relaxed mb-6">{copy.body}</p>
          <Link
            href="/dashboard/bookings"
            className="inline-block bg-orange-600 text-white px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-orange-700 transition"
          >
            View my bookings
          </Link>
        </div>
      </main>
    </>
  );
}

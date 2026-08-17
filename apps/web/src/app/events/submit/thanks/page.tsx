import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";

export const metadata = { title: "Submitted — dontbeboring" };

export default function SubmitEventThanksPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-lg mx-auto px-6 py-16 text-center">
        <p className="text-5xl mb-5">🎉</p>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Submitted for review</h1>
        <p className="text-sm text-gray-500 mb-8">
          Thanks — we typically review new events within 24 hours. You'll be able to see its
          status from your partner portal, and it'll go live automatically once approved.
        </p>
        <Link
          href="/partner/events"
          className="inline-block bg-orange-600 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
        >
          Go to my events
        </Link>
      </main>
    </div>
  );
}

import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { getTicketForCheckIn } from "../actions";
import { CheckInButton } from "./CheckInButton";

interface PageProps {
  params: Promise<{ token: string }>;
}

export default async function CheckInPage({ params }: PageProps) {
  const { token } = await params;
  const result = await getTicketForCheckIn(token);

  return (
    <>
      <NavBar />
      <main className="max-w-md mx-auto px-4 py-16">
        {result.error ? (
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <p className="text-3xl mb-3">🚫</p>
            <p className="font-semibold text-gray-900 mb-1">Can't check in this ticket</p>
            <p className="text-sm text-gray-500 mb-4">{result.error}</p>
            <Link href="/partner/checkin" className="text-sm text-orange-600 hover:underline">
              Enter a code manually →
            </Link>
          </div>
        ) : (
          <div className="rounded-2xl border border-gray-200 bg-white p-8">
            <p className="text-xs font-medium text-gray-400 uppercase tracking-wide mb-1">Event ticket</p>
            <h1 className="text-xl font-bold text-gray-900 mb-1">{result.ticket!.eventTitle}</h1>
            <p className="text-sm text-gray-600 mb-6">
              {result.ticket!.guestName} · {result.ticket!.quantity} ticket{result.ticket!.quantity !== 1 ? "s" : ""}
            </p>
            <CheckInButton token={token} initialCheckedInAt={result.ticket!.checkedInAt} />
          </div>
        )}
      </main>
    </>
  );
}

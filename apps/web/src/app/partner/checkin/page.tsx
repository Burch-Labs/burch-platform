import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { NavBar } from "@/components/layout/NavBar";
import { CodeEntryForm } from "./CodeEntryForm";

export default async function PartnerCheckInPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && session.user.role !== "ADMIN") {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-md mx-auto px-6 py-16">
        <Link href="/partner" className="text-sm text-gray-500 hover:text-gray-700">
          ← Partner Portal
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2 mb-2">Ticket check-in</h1>
        <p className="text-sm text-gray-500 mb-8">
          Scan a guest's ticket QR with your phone's camera app — it opens straight to the check-in screen. No
          camera handy? Type the 8-character code from their ticket below.
        </p>
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <CodeEntryForm />
        </div>
      </main>
    </div>
  );
}

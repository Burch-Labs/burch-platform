import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import { PayoutStatusCard } from "@/components/partner/PayoutStatusCard";
import { PayoutForm } from "./PayoutForm";

export const metadata = { title: "Payout details — dontbeboringKE" };

export default async function PayoutsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) redirect("/auth/join?callbackUrl=/partner/payouts");

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      payoutAccount: {
        select: {
          status: true,
          rejectionReason: true,
          legalName: true,
          taxId: true,
          idNumber: true,
          mpesaNumber: true,
          bankName: true,
          bankAccount: true,
        },
      },
    },
  });
  if (!partner) redirect("/partner");

  const account = partner.payoutAccount;
  // Once verified the details are locked in the UI. Letting someone quietly
  // change the destination account after approval would defeat the check that
  // approved them.
  const locked = account?.status === "VERIFIED" || account?.status === "SUBMITTED";

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-2xl mx-auto px-6 py-8">
        <div className="flex items-center gap-2 text-sm text-gray-400 mb-5">
          <Link href="/partner" className="hover:text-orange-600 transition">Partner</Link>
          <span>/</span>
          <span className="text-gray-600">Payout details</span>
        </div>

        <h1 className="text-2xl font-bold text-gray-900 mb-2">Payout details</h1>
        <p className="text-sm text-gray-500 mb-6">
          You can list and sell without these. We need them before any money can be
          released to you, and a person checks them rather than a script.
        </p>

        <PayoutStatusCard
          status={account?.status ?? null}
          rejectionReason={account?.rejectionReason}
        />

        {locked ? (
          <div className="bg-surface rounded-2xl border border-gray-100 p-6 space-y-3">
            <Row label="Name" value={account?.legalName} />
            <Row label="KRA PIN" value={mask(account?.taxId)} />
            <Row label="ID / registration" value={mask(account?.idNumber)} />
            {account?.mpesaNumber && <Row label="M-Pesa" value={mask(account.mpesaNumber)} />}
            {account?.bankAccount && (
              <Row label="Bank" value={`${account.bankName ?? ""} ${mask(account.bankAccount)}`} />
            )}
            <p className="text-xs text-gray-400 pt-2 border-t border-gray-100">
              To change these, contact support. Changing a payout destination after
              verification needs a fresh check.
            </p>
          </div>
        ) : (
          <PayoutForm
            defaults={{
              legalName: account?.legalName ?? "",
              taxId: account?.taxId ?? "",
              idNumber: account?.idNumber ?? "",
              mpesaNumber: account?.mpesaNumber ?? "",
              bankName: account?.bankName ?? "",
              bankAccount: account?.bankAccount ?? "",
            }}
          />
        )}
      </main>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex justify-between gap-4 text-sm">
      <span className="text-gray-400">{label}</span>
      <span className="font-medium text-gray-900 truncate">{value || "—"}</span>
    </div>
  );
}

/** Shows enough to recognise the entry without reprinting the whole identifier. */
function mask(value?: string | null): string {
  if (!value) return "—";
  const tail = value.slice(-4);
  return `${"•".repeat(Math.max(0, value.length - 4))}${tail}`;
}

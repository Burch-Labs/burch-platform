import { redirect } from "next/navigation";

/**
 * Admin has no dashboard of its own — the work is queues. Land on payouts,
 * which is the one where a delay costs a partner money.
 */
export default function AdminIndex() {
  redirect("/admin/payouts");
}

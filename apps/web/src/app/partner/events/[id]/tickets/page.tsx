import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";
import { TiersManager } from "./TiersManager";
import { DiscountsManager } from "./DiscountsManager";
import { createTier, updateTier, deleteTier, createDiscountCode, updateDiscountCode, deleteDiscountCode } from "./actions";
import { isAdminRole } from "@/lib/roles";

interface Props {
  params: Promise<{ id: string }>;
}

export default async function ManageEventTicketsPage({ params }: Props) {
  const { id } = await params;

  const session = await getServerSession(authOptions);
  if (!session) redirect("/auth/login");
  if (session.user.role !== "PARTNER" && !isAdminRole(session.user.role)) {
    redirect("/dashboard");
  }

  const partner = await prisma.partner.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });
  if (!partner) redirect("/partner/onboarding");

  const event = await prisma.event.findFirst({
    where: { id, partnerId: partner.id },
    select: {
      id: true,
      title: true,
      tiers: { orderBy: [{ sortOrder: "asc" }, { createdAt: "asc" }] },
      discountCodes: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!event) notFound();

  // Sold count per tier, computed live — same principle as event capacity:
  // a stored counter drifts, a query at read time doesn't.
  const soldByTier = await prisma.booking.groupBy({
    by: ["ticketTierId"],
    where: { ticketTierId: { in: event.tiers.map((t) => t.id) }, status: { not: "CANCELLED" } },
    _sum: { quantity: true },
  });
  const soldMap = new Map(soldByTier.map((r) => [r.ticketTierId, r._sum.quantity ?? 0]));

  const tiers = event.tiers.map((t) => ({
    id: t.id,
    name: t.name,
    price: Number(t.price),
    currency: t.currency,
    capacity: t.capacity,
    sold: soldMap.get(t.id) ?? 0,
    salesStart: t.salesStart ? t.salesStart.toISOString() : null,
    salesEnd: t.salesEnd ? t.salesEnd.toISOString() : null,
    isActive: t.isActive,
  }));

  const discounts = event.discountCodes.map((d) => ({
    id: d.id,
    code: d.code,
    type: d.type,
    value: Number(d.value),
    maxUses: d.maxUses,
    usedCount: d.usedCount,
    expiresAt: d.expiresAt ? d.expiresAt.toISOString() : null,
    isActive: d.isActive,
  }));

  const boundCreateTier = createTier.bind(null, event.id);
  const tierUpdateActions = Object.fromEntries(tiers.map((t) => [t.id, updateTier.bind(null, event.id, t.id)]));
  const boundDeleteTier = deleteTier.bind(null, event.id);

  const boundCreateDiscount = createDiscountCode.bind(null, event.id);
  const discountUpdateActions = Object.fromEntries(discounts.map((d) => [d.id, updateDiscountCode.bind(null, event.id, d.id)]));
  const boundDeleteDiscount = deleteDiscountCode.bind(null, event.id);

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8 flex-wrap">
          <Link href="/partner/events" className="text-sm text-gray-500 hover:text-gray-700">
            ← My events
          </Link>
          <span className="text-gray-300">/</span>
          <Link href={`/partner/events/${event.id}/edit`} className="text-sm text-gray-500 hover:text-gray-700 truncate max-w-[160px]">
            {event.title}
          </Link>
          <span className="text-gray-300">/</span>
          <h1 className="text-sm font-semibold text-gray-900">Tickets</h1>
        </div>

        <section className="mb-12">
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Ticket tiers</h2>
            <p className="text-sm text-gray-500 mt-1">
              Different prices and limited quantities — Early Bird, Regular, VIP. Leave empty and the
              event's flat price still applies.
            </p>
          </div>
          <TiersManager
            tiers={tiers}
            createAction={boundCreateTier}
            updateActions={tierUpdateActions}
            deleteAction={boundDeleteTier}
          />
        </section>

        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-gray-900">Promo codes</h2>
            <p className="text-sm text-gray-500 mt-1">
              Discounts buyers can apply at checkout, scoped to this event.
            </p>
          </div>
          <DiscountsManager
            discounts={discounts}
            createAction={boundCreateDiscount}
            updateActions={discountUpdateActions}
            deleteAction={boundDeleteDiscount}
          />
        </section>
      </main>
    </div>
  );
}

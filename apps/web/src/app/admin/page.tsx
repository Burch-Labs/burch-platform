import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { NavBar } from "@/components/layout/NavBar";
import Link from "next/link";

export default async function AdminPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") redirect("/dashboard");

  const [userCount, partnerCount, pendingPartners] = await Promise.all([
    prisma.user.count(),
    prisma.partner.count(),
    prisma.partner.count({ where: { status: "PENDING" } }),
  ]);

  const recentUsers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 5,
    select: { id: true, name: true, email: true, role: true, createdAt: true, emailVerified: true },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <NavBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <p className="text-sm text-gray-500 mt-1">Platform overview and management</p>
          </div>
          <Link
            href="/dashboard"
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← Dashboard
          </Link>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {[
            { label: "Total Users", value: userCount, color: "text-blue-600" },
            { label: "Partners", value: partnerCount, color: "text-green-600" },
            { label: "Pending Approvals", value: pendingPartners, color: "text-amber-600" },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-200 p-6">
              <p className="text-sm text-gray-500 mb-1">{label}</p>
              <p className={`text-3xl font-bold ${color}`}>{value}</p>
            </div>
          ))}
        </div>

        {/* Recent Users */}
        <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="font-semibold text-gray-900">Recent Users</h2>
          </div>
          <div className="divide-y divide-gray-50">
            {recentUsers.length === 0 ? (
              <p className="px-6 py-8 text-sm text-gray-400 text-center">No users yet.</p>
            ) : (
              recentUsers.map((user) => (
                <div key={user.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{user.name ?? "—"}</p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {user.emailVerified ? (
                      <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Verified</span>
                    ) : (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">Unverified</span>
                    )}
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                      {user.role}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

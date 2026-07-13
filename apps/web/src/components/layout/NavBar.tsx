import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";
import { SignOutButton } from "./SignOutButton";

const ROLE_BADGE: Record<string, string> = {
  ADMIN: "bg-purple-100 text-purple-700",
  PARTNER: "bg-blue-100 text-blue-700",
  CUSTOMER: "bg-green-100 text-green-700",
};

export async function NavBar() {
  const session = await getServerSession(authOptions);
  const role = session?.user?.role ?? "CUSTOMER";

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-xl font-bold text-orange-600">
          Burch
        </Link>

        {session ? (
          <div className="flex items-center gap-3">
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${ROLE_BADGE[role]}`}
            >
              {role.charAt(0) + role.slice(1).toLowerCase()}
            </span>
            <span className="text-sm text-gray-600 hidden sm:block">
              {session.user.name ?? session.user.email}
            </span>
            <SignOutButton />
          </div>
        ) : (
          <div className="flex gap-3">
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">
              Sign in
            </Link>
            <Link
              href="/auth/register"
              className="text-sm bg-orange-600 text-white px-4 py-2 rounded-lg hover:bg-orange-700 transition"
            >
              Get started
            </Link>
          </div>
        )}
      </div>
    </header>
  );
}

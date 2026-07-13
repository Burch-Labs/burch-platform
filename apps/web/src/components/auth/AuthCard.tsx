import Link from "next/link";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Link href="/" className="block text-xl font-bold text-orange-600 mb-8">
          Burch
        </Link>
        <div className="bg-white rounded-2xl border border-gray-200 p-8 shadow-sm">
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{title}</h1>
          {subtitle && (
            <p className="text-sm text-gray-500 mb-7">{subtitle}</p>
          )}
          {children}
        </div>
      </div>
    </div>
  );
}

import { Logo } from "@/components/layout/Logo";

interface AuthCardProps {
  children: React.ReactNode;
  title: string;
  subtitle?: string;
}

export function AuthCard({ children, title, subtitle }: AuthCardProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-12">
      <div className="w-full max-w-md">
        <Logo className="flex items-center gap-2 text-orange-600 mb-8" />
        <div className="bg-surface rounded-2xl border border-gray-200 p-8 shadow-[0_4px_24px_0_rgba(30,21,16,0.07)]">
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

import { cn } from "@/lib/utils";

interface PriceRangeBadgeProps {
  priceRange: number | null;
  className?: string;
}

const LABELS: Record<number, string> = { 1: "Budget", 2: "Moderate", 3: "Upscale", 4: "Fine Dining" };
const COLORS: Record<number, string> = {
  1: "bg-green-50 text-green-700",
  2: "bg-blue-50 text-blue-700",
  3: "bg-purple-50 text-purple-700",
  4: "bg-amber-50 text-amber-700",
};

export function PriceRangeBadge({ priceRange, className }: PriceRangeBadgeProps) {
  if (!priceRange) return null;
  const symbols = "KES".repeat(priceRange);
  const label = LABELS[priceRange] ?? "";
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full", COLORS[priceRange] ?? "bg-gray-50 text-gray-600", className)}>
      <span>{symbols}</span>
      <span className="opacity-60">·</span>
      <span>{label}</span>
    </span>
  );
}

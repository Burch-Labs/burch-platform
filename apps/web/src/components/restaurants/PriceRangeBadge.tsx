import { cn } from "@/lib/utils";

interface PriceRangeBadgeProps {
  priceRange: number | null;
  className?: string;
}

const TIERS = 4;
const LABELS: Record<number, string> = { 1: "Budget", 2: "Moderate", 3: "Upscale", 4: "Fine Dining" };
const COLORS: Record<number, string> = {
  1: "bg-gray-100 text-gray-600",
  2: "bg-gray-100 text-gray-700",
  3: "bg-orange-50 text-orange-700",
  4: "bg-orange-100 text-orange-800",
};

export function PriceRangeBadge({ priceRange, className }: PriceRangeBadgeProps) {
  if (!priceRange) return null;
  const label = LABELS[priceRange] ?? "";
  // The $$$ convention needs a single-glyph currency symbol, which the
  // shilling does not have — repeating "KES" rendered as "KESKESKES". Show the
  // code once and carry the tier in filled dots instead.
  const dots = "●".repeat(priceRange) + "○".repeat(Math.max(0, TIERS - priceRange));
  return (
    <span className={cn("inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full", COLORS[priceRange] ?? "bg-gray-50 text-gray-600", className)}>
      <span>KSh</span>
      <span className="tracking-tight" aria-hidden>{dots}</span>
      <span className="opacity-60">·</span>
      <span>{label}</span>
      <span className="sr-only">price tier {priceRange} of {TIERS}</span>
    </span>
  );
}

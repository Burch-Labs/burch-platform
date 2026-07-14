import { cn } from "@/lib/utils";

const AMENITY_ICONS: Record<string, string> = {
  "WiFi": "📶",
  "Swimming Pool": "🏊",
  "Gym": "💪",
  "Restaurant": "🍽️",
  "Bar": "🍸",
  "Spa": "💆",
  "Parking": "🅿️",
  "Airport Shuttle": "🚌",
  "24h Front Desk": "🛎️",
  "Business Center": "💼",
  "Conference Rooms": "👥",
  "Room Service": "🛏️",
  "Laundry": "👕",
  "Concierge": "🎩",
  "Kids Club": "🧸",
  "Beach Access": "🏖️",
  "Air Conditioning": "❄️",
  "Flat-screen TV": "📺",
  "Mini Bar": "🍷",
  "Safe": "🔒",
  "Coffee Maker": "☕",
  "Bathtub": "🛁",
  "Walk-in Shower": "🚿",
  "Balcony": "🌅",
  "City View": "🏙️",
  "Ocean View": "🌊",
  "Work Desk": "🖥️",
  "Kitchenette": "🍳",
};

interface AmenityListProps {
  amenities: string[];
  max?: number;
  size?: "sm" | "md";
  className?: string;
}

export function AmenityList({ amenities, max, size = "md", className }: AmenityListProps) {
  const shown = max ? amenities.slice(0, max) : amenities;
  const hidden = max ? amenities.length - max : 0;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {shown.map((a) => (
        <span
          key={a}
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border border-gray-100 bg-gray-50 text-gray-600",
            size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
          )}
        >
          <span>{AMENITY_ICONS[a] ?? "✓"}</span>
          {a}
        </span>
      ))}
      {hidden > 0 && (
        <span
          className={cn(
            "inline-flex items-center rounded-full border border-gray-100 bg-gray-50 text-gray-400",
            size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm"
          )}
        >
          +{hidden} more
        </span>
      )}
    </div>
  );
}

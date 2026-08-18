import type { HotelCard } from "@/types/hotels";
import { HotelCard as HotelCardComponent } from "./HotelCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface HotelGridProps {
  hotels: HotelCard[];
  emptyMessage?: string;
  emptyAction?: React.ReactNode;
}

export function HotelGrid({ hotels, emptyMessage, emptyAction }: HotelGridProps) {
  if (hotels.length === 0) {
    return (
      <EmptyState
        emoji="🏨"
        title="No hotels found"
        description={emptyMessage ?? "Try adjusting your search or filters."}
        action={emptyAction}
      />
    );
  }

  return (
    <div className="flex flex-col divide-y divide-gray-100 border-t border-b border-gray-100">
      {hotels.map((hotel) => (
        <HotelCardComponent key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
}

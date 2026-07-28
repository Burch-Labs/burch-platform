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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {hotels.map((hotel) => (
        <HotelCardComponent key={hotel.id} hotel={hotel} />
      ))}
    </div>
  );
}

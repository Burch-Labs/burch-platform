import { RestaurantCard } from "./RestaurantCard";
import { EmptyState } from "@/components/ui/EmptyState";
import type { RestaurantCard as RestaurantCardType } from "@/types/restaurants";

interface RestaurantGridProps {
  restaurants: RestaurantCardType[];
}

export function RestaurantGrid({ restaurants }: RestaurantGridProps) {
  if (restaurants.length === 0) {
    return (
      <EmptyState
        emoji="🍽️"
        title="No restaurants found"
        description="Try adjusting your search or filters."
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {restaurants.map((r) => (
        <RestaurantCard key={r.id} restaurant={r} />
      ))}
    </div>
  );
}

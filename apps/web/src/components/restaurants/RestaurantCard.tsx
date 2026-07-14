import Link from "next/link";
import Image from "next/image";
import { StarRating } from "@/components/hotels/StarRating";
import { PriceRangeBadge } from "./PriceRangeBadge";
import { AmenityList } from "@/components/hotels/AmenityList";
import type { RestaurantCard as RestaurantCardType } from "@/types/restaurants";

interface RestaurantCardProps {
  restaurant: RestaurantCardType;
}

export function RestaurantCard({ restaurant }: RestaurantCardProps) {
  return (
    <Link
      href={`/restaurants/${restaurant.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
    >
      {/* Cover */}
      <div className="relative h-48 overflow-hidden">
        {restaurant.imageUrl ? (
          <Image
            src={restaurant.imageUrl}
            alt={restaurant.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-rose-400 to-orange-500 flex items-center justify-center">
            <span className="text-5xl opacity-40">🍽️</span>
          </div>
        )}
        <div className="absolute top-3 left-3 flex gap-1.5">
          {restaurant.priceRange && <PriceRangeBadge priceRange={restaurant.priceRange} />}
        </div>
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-1 group-hover:text-orange-600 transition-colors flex-1">
            {restaurant.name}
          </h3>
          {restaurant.avgRating && (
            <span className="text-xs font-bold text-white bg-orange-500 rounded-md px-1.5 py-0.5 flex-shrink-0">
              {restaurant.avgRating.toFixed(1)}
            </span>
          )}
        </div>

        {/* Cuisine + location */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
          {restaurant.cuisine && (
            <span className="font-medium text-gray-700">{restaurant.cuisine}</span>
          )}
          <span className="flex items-center gap-1">
            <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0zM15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            {restaurant.city}
          </span>
        </div>

        {/* Amenities preview */}
        {restaurant.amenities.length > 0 && (
          <AmenityList amenities={restaurant.amenities} max={3} size="sm" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-50">
          <span className="text-xs text-gray-400">
            {restaurant._count.menuItems > 0 ? `${restaurant._count.menuItems} menu items` : "Menu available"}
          </span>
          {restaurant.avgRating && restaurant._count.reviews > 0 && (
            <StarRating rating={restaurant.avgRating} size="sm" count={restaurant._count.reviews} />
          )}
        </div>
      </div>
    </Link>
  );
}

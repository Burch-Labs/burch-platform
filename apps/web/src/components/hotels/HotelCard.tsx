import Link from "next/link";
import Image from "next/image";
import { HotelStars, StarRating } from "./StarRating";
import { AmenityList } from "./AmenityList";
import { formatCurrency } from "@/lib/format";
import type { HotelCard as HotelCardType } from "@/types/hotels";

interface HotelCardProps {
  hotel: HotelCardType;
}

export function HotelCard({ hotel }: HotelCardProps) {
  const minPrice = hotel.rooms.length > 0
    ? Math.min(...hotel.rooms.map((r) => Number(r.price)))
    : null;
  const currency = hotel.rooms[0]?.currency ?? "KES";

  return (
    <Link
      href={`/hotels/${hotel.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
    >
      {/* Cover image */}
      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-blue-400 to-indigo-600">
        {hotel.imageUrl ? (
          <Image
            src={hotel.imageUrl}
            alt={hotel.name}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center">
            <span className="text-5xl opacity-40">🏨</span>
          </div>
        )}

        {/* Star classification badge */}
        {hotel.starRating && (
          <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm rounded-full px-2.5 py-1 flex items-center gap-1">
            <HotelStars stars={hotel.starRating} />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2.5">
        {/* Name + rating */}
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors flex-1">
            {hotel.name}
          </h3>
          {hotel.avgRating && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <span className="text-xs font-bold text-white bg-orange-500 rounded-md px-1.5 py-0.5">
                {hotel.avgRating.toFixed(1)}
              </span>
            </div>
          )}
        </div>

        {/* Location */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{hotel.location}</span>
          {hotel.city && <span className="text-gray-400 flex-shrink-0">· {hotel.city}</span>}
        </p>

        {/* Top amenities */}
        {hotel.amenities.length > 0 && (
          <AmenityList amenities={hotel.amenities} max={3} size="sm" />
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2.5 border-t border-gray-50">
          <div>
            {minPrice !== null ? (
              <>
                <span className="text-xs text-gray-400">from </span>
                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(minPrice, currency)}
                </span>
                <span className="text-xs text-gray-400"> /night</span>
              </>
            ) : (
              <span className="text-xs text-gray-400">Contact for pricing</span>
            )}
          </div>
          {hotel._count.reviews > 0 && hotel.avgRating && (
            <StarRating
              rating={hotel.avgRating}
              size="sm"
              count={hotel._count.reviews}
            />
          )}
        </div>
      </div>
    </Link>
  );
}

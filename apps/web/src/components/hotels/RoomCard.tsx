import Image from "next/image";
import Link from "next/link";
import type { Room } from "@prisma/client";
import { formatCurrency } from "@/lib/format";
import { AmenityList } from "./AmenityList";
import { cn } from "@/lib/utils";
import { FEATURES } from "@/lib/features";

interface RoomCardProps {
  room: Room & { availableCount?: number; isAvailable?: boolean };
  hotelId: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  showBookButton?: boolean;
}

const BED_ICONS: Record<string, string> = {
  King: "👑",
  Queen: "🛏️",
  Twin: "🛏️",
  Double: "🛏️",
  Single: "🛌",
  Bunk: "🪜",
};

export function RoomCard({
  room,
  hotelId,
  checkIn,
  checkOut,
  guests,
  showBookButton = true,
}: RoomCardProps) {
  const isAvailable = room.isAvailable !== false;
  const price = Number(room.price);

  const bookHref =
    `/hotels/${hotelId}/book?roomId=${room.id}` +
    (checkIn ? `&checkIn=${checkIn}` : "") +
    (checkOut ? `&checkOut=${checkOut}` : "") +
    (guests ? `&guests=${guests}` : "");

  return (
    <div
      className={cn(
        "bg-white rounded-2xl border overflow-hidden flex flex-col sm:flex-row gap-0",
        isAvailable ? "border-gray-100" : "border-gray-100 opacity-60"
      )}
    >
      {/* Image */}
      <div className="relative w-full sm:w-52 h-44 sm:h-auto flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-200">
        {room.imageUrl ? (
          <Image
            src={room.imageUrl}
            alt={room.name}
            fill
            className="object-cover"
            sizes="(max-width: 640px) 100vw, 200px"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl opacity-30">
            🛏️
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col flex-1 p-5 gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="font-semibold text-gray-900 text-base">{room.name}</h3>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
              {room.bedType && (
                <span>{BED_ICONS[room.bedType] ?? "🛏️"} {room.bedType} bed</span>
              )}
              <span>👤 Up to {room.maxGuests} guests</span>
            </div>
          </div>
          {FEATURES.roomRates && (
            <div className="text-right flex-shrink-0">
              <p className="text-xl font-bold text-gray-900">
                {formatCurrency(price, room.currency)}
              </p>
              <p className="text-xs text-gray-400">per night</p>
            </div>
          )}
        </div>

        {room.description && (
          <p className="text-sm text-gray-500 leading-relaxed line-clamp-2">
            {room.description}
          </p>
        )}

        {room.amenities.length > 0 && (
          <AmenityList amenities={room.amenities} max={5} size="sm" />
        )}

        <div className="flex items-center justify-between mt-auto pt-3 border-t border-gray-50">
          {room.availableCount !== undefined ? (
            <span className={cn("text-xs font-medium", isAvailable ? "text-green-600" : "text-gray-400")}>
              {isAvailable ? `${room.availableCount} room${room.availableCount > 1 ? "s" : ""} available` : "Not available"}
            </span>
          ) : (
            <span className="text-xs text-gray-400">{room.quantity} room{room.quantity > 1 ? "s" : ""}</span>
          )}

          {showBookButton && (
            isAvailable ? (
              <Link
                href={bookHref}
                className="bg-orange-600 text-white px-5 py-2 rounded-xl text-sm font-semibold hover:bg-orange-700 transition"
              >
                Reserve
              </Link>
            ) : (
              <span className="text-sm text-gray-400 font-medium">Unavailable</span>
            )
          )}
        </div>
      </div>
    </div>
  );
}

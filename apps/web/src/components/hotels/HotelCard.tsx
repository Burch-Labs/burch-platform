import Link from "next/link";
import type { HotelCard as HotelCardType } from "@/types/hotels";

interface HotelCardProps {
  hotel: HotelCardType;
}

export function HotelCard({ hotel }: HotelCardProps) {
  return (
    <Link
      href={`/hotels/${hotel.id}#happenings`}
      className="group flex items-center justify-between gap-4 py-4 px-1 hover:bg-orange-50/60 transition-colors rounded-xl"
    >
      <div className="min-w-0">
        <h3 className="font-semibold text-gray-900 group-hover:text-orange-700 transition-colors truncate">
          {hotel.name}
        </h3>
        <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{hotel.location}</span>
          {hotel.city && <span className="text-gray-400 flex-shrink-0">· {hotel.city}</span>}
        </p>
      </div>

      <div className="flex-shrink-0 flex items-center gap-1.5 text-xs font-medium text-orange-600 bg-orange-50 border border-orange-100 rounded-full px-3 py-1.5 group-hover:bg-orange-100 transition-colors">
        <span aria-hidden>✨</span>{" "}
        {hotel._count.happenings > 0
          ? `${hotel._count.happenings} happening${hotel._count.happenings !== 1 ? "s" : ""}`
          : "Happenings — coming soon"}
      </div>
    </Link>
  );
}

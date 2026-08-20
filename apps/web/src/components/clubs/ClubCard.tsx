import Link from "next/link";
import Image from "next/image";
import { AmenityList } from "@/components/hotels/AmenityList";
import { AccessBadge } from "./AccessBadge";
import { formatCurrency } from "@/lib/format";
import type { ClubAccess, ClubCategory } from "@prisma/client";

export interface ClubCardData {
  id: string;
  name: string;
  city: string;
  location: string;
  category: ClubCategory;
  access: ClubAccess;
  holes: number | null;
  par: number | null;
  /** Prisma hands back a Decimal for money columns, hence the loose type. */
  visitorFee: { toString(): string } | string | number | null;
  currency: string;
  imageUrl: string | null;
  amenities: string[];
}

/**
 * Leads with access rather than price. Whether a visitor can play at all is the
 * question a green fee cannot answer, and it is the one that decides if the
 * rest of the card is worth reading.
 */
export function ClubCard({ club, priority = false }: { club: ClubCardData; priority?: boolean }) {
  const fee = club.visitorFee === null ? null : Number(club.visitorFee);

  return (
    <Link
      href={`/clubs/${club.id}`}
      className="group flex flex-col bg-surface rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
    >
      <div className="relative h-44 overflow-hidden bg-gradient-to-br from-gray-700 to-gray-900">
        {club.imageUrl ? (
          <Image
            src={club.imageUrl}
            alt={club.name}
            fill
            priority={priority}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-5xl opacity-30">⛳</span>
          </div>
        )}
        <div className="absolute top-3 left-3">
          <AccessBadge access={club.access} />
        </div>
      </div>

      <div className="flex flex-col flex-1 p-4 gap-2.5">
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {club.name}
        </h3>

        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{club.location}</span>
        </p>

        {club.holes !== null && (
          <p className="text-xs text-gray-600 font-medium">
            {club.holes} holes{club.par !== null && ` · par ${club.par}`}
          </p>
        )}

        {club.amenities.length > 0 && (
          <AmenityList amenities={club.amenities} max={3} size="sm" />
        )}

        <div className="mt-auto pt-2.5 border-t border-gray-50">
          {fee !== null ? (
            <>
              <span className="text-xs text-gray-400">visitor green fee from </span>
              <span className="text-sm font-bold text-gray-900">
                {formatCurrency(fee, club.currency)}
              </span>
            </>
          ) : (
            <span className="text-xs text-gray-400">Contact the club for fees</span>
          )}
        </div>
      </div>
    </Link>
  );
}

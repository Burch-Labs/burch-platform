import Link from "next/link";
import Image from "next/image";
import type { EventWithPartner } from "@/types/events";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/types/events";
import { Badge } from "@/components/ui/Badge";
import { formatCurrency, formatDate, formatTime, ticketsRemaining } from "@/lib/format";

interface EventCardProps {
  event: EventWithPartner;
  priority?: boolean;
}

export function EventCard({ event, priority = false }: EventCardProps) {
  const colors = CATEGORY_COLORS[event.category];
  const remaining = ticketsRemaining(
    event.capacity,
    event._count.bookings
  );
  const isSoldOut = remaining === 0;
  const isLowStock = remaining > 0 && remaining <= 10;

  return (
    <Link
      href={`/events/${event.id}`}
      className="group flex flex-col bg-white rounded-2xl border border-gray-100 overflow-hidden hover:border-orange-200 hover:shadow-md transition-all duration-200"
    >
      {/* Cover image / gradient */}
      <div className="relative h-44 overflow-hidden">
        {event.imageUrl ? (
          <Image
            src={event.imageUrl}
            alt={event.title}
            fill
            priority={priority}
            // Proxy-served images (/api/images/…) are already optimised and
            // cached by the route handler; skip Next.js image optimisation so
            // the optimizer doesn't try to re-fetch them via localhost.
            unoptimized={event.imageUrl.startsWith("/api/images/")}
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className={`w-full h-full bg-gradient-to-br ${colors.gradient}`} />
        )}

        {/* Category badge */}
        <div className="absolute top-3 left-3">
          <Badge className={`${colors.bg} ${colors.text} shadow-sm`}>
            {CATEGORY_LABELS[event.category]}
          </Badge>
        </div>

        {/* Sold out overlay */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <span className="text-white font-bold text-lg tracking-wide">SOLD OUT</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-2">
        {/* Date */}
        <p className="text-xs font-medium text-orange-600">
          {formatDate(event.startDate)} · {formatTime(event.startDate)}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2 group-hover:text-orange-600 transition-colors">
          {event.title}
        </h3>

        {/* Location */}
        <p className="text-xs text-gray-500 flex items-center gap-1">
          <svg className="w-3.5 h-3.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <span className="truncate">{event.location}</span>
          {event.city && <span className="text-gray-400">· {event.city}</span>}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between mt-auto pt-2 border-t border-gray-50">
          <span className="text-sm font-bold text-gray-900">
            {formatCurrency(event.price, event.currency)}
          </span>

          {isLowStock && !isSoldOut ? (
            <span className="text-xs text-amber-600 font-medium">
              {remaining} left
            </span>
          ) : !isSoldOut ? (
            <span className="text-xs text-gray-400">
              {remaining} tickets
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}

import Image from "next/image";
import { StarRating } from "./StarRating";
import { formatDateShort } from "@/lib/format";
import type { HotelReviewWithUser } from "@/types/hotels";

interface ReviewCardProps {
  review: HotelReviewWithUser;
}

export function ReviewCard({ review }: ReviewCardProps) {
  const initials = (review.user.name ?? "?")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-surface rounded-2xl border border-gray-100 p-5">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {review.user.image ? (
          <Image
            src={review.user.image}
            alt={review.user.name ?? ""}
            width={36}
            height={36}
            className="rounded-full object-cover flex-shrink-0"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 text-xs font-bold flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">
            {review.user.name ?? "Guest"}
          </p>
          <p className="text-xs text-gray-400">{formatDateShort(review.createdAt)}</p>
        </div>
        <StarRating rating={review.rating} size="sm" />
      </div>

      {review.title && (
        <p className="font-semibold text-gray-900 text-sm mb-1">{review.title}</p>
      )}
      <p className="text-sm text-gray-600 leading-relaxed">{review.comment}</p>
    </div>
  );
}

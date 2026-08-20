import Link from "next/link";
import Image from "next/image";
import type { Partner, User } from "@prisma/client";

interface OrganizerCardProps {
  partner: Partner & {
    user: Pick<User, "id" | "name" | "image">;
    _count?: { events: number };
  };
}

export function OrganizerCard({ partner }: OrganizerCardProps) {
  const displayName = partner.name;
  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="rounded-2xl border border-gray-100 bg-surface p-5">
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-3">
        Organized by
      </p>
      <div className="flex items-center gap-3 mb-3">
        {partner.logoUrl || partner.user.image ? (
          <Image
            src={(partner.logoUrl ?? partner.user.image)!}
            alt={displayName}
            width={44}
            height={44}
            className="rounded-full object-cover"
          />
        ) : (
          <div className="w-11 h-11 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-bold text-sm flex-shrink-0">
            {initials}
          </div>
        )}
        <div className="min-w-0">
          <p className="font-semibold text-gray-900 truncate">{displayName}</p>
          {partner._count && (
            <p className="text-xs text-gray-500">
              {partner._count.events} event{partner._count.events !== 1 ? "s" : ""}
            </p>
          )}
        </div>
      </div>

      {partner.description && (
        <p className="text-sm text-gray-500 line-clamp-3 mb-3">
          {partner.description}
        </p>
      )}

      <Link
        href={`/organizer/${partner.id}`}
        className="text-sm text-orange-600 font-medium hover:underline"
      >
        View all events →
      </Link>
    </div>
  );
}

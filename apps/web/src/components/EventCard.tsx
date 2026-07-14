import Link from "next/link";
import { Event } from "@/types/event";

type Props = {
  event: Event;
};

export default function EventCard({ event }: Props) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm hover:shadow-lg transition overflow-hidden">
      <div className="h-48 bg-gray-200"></div>

      <div className="p-5">
        <span className="inline-block rounded-full bg-red-600 px-3 py-1 text-xs font-medium text-white">
          {event.category}
        </span>

        <h2 className="mt-3 text-2xl font-bold">
          {event.title}
        </h2>

        <p className="mt-2 text-gray-600">
          📍 {event.venue}, {event.city}
        </p>

        <p className="text-gray-600">
          📅 {event.startDate}
        </p>

        <p className="mt-4 text-xl font-bold text-red-600">
          {event.currency} {event.price.toLocaleString()}
        </p>

        <Link
          href={`/events/${event.id}`}
          className="mt-6 block rounded-lg bg-black py-3 text-center text-white hover:bg-red-600 transition"
        >
          View Details
        </Link>
      </div>
    </div>
  );
}
import type { EventWithPartner } from "@/types/events";
import { EventCard } from "./EventCard";
import { EmptyState } from "@/components/ui/EmptyState";

interface EventGridProps {
  events: EventWithPartner[];
  emptyMessage?: string;
}

export function EventGrid({ events, emptyMessage }: EventGridProps) {
  if (events.length === 0) {
    return (
      <EmptyState
        emoji="🎟️"
        title="No events found"
        description={emptyMessage ?? "Try adjusting your search or filters."}
      />
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {events.map((event) => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
}

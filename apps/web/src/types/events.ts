import type { Event, Partner, User, Booking, EventCategory } from "@prisma/client";

export type EventWithPartner = Event & {
  partner: Partner & {
    user: Pick<User, "id" | "name" | "image">;
  };
  _count: { bookings: number };
};

export type EventDetail = EventWithPartner & {
  bookings: Array<Pick<Booking, "id" | "quantity">>;
};

export type OrganizerWithEvents = Partner & {
  user: Pick<User, "id" | "name" | "image">;
  events: Event[];
  _count: { events: true };
};

export interface EventFilters {
  q?: string;
  category?: EventCategory | "";
  city?: string;
  page?: number;
}

export const CATEGORY_LABELS: Record<EventCategory, string> = {
  MUSIC: "Music",
  SPORTS: "Sports",
  ARTS: "Arts",
  FOOD_DRINK: "Food & Drink",
  TECH: "Tech",
  BUSINESS: "Business",
  COMEDY: "Comedy",
  FILM: "Film",
  EDUCATION: "Education",
  OTHER: "Other",
};

export const CATEGORY_COLORS: Record<EventCategory, { bg: string; text: string; gradient: string }> = {
  MUSIC:     { bg: "bg-purple-100", text: "text-purple-700", gradient: "from-purple-500 to-pink-500" },
  SPORTS:    { bg: "bg-blue-100",   text: "text-blue-700",   gradient: "from-blue-500 to-cyan-500" },
  ARTS:      { bg: "bg-rose-100",   text: "text-rose-700",   gradient: "from-rose-500 to-orange-400" },
  FOOD_DRINK:{ bg: "bg-green-100",  text: "text-green-700",  gradient: "from-green-500 to-emerald-400" },
  TECH:      { bg: "bg-indigo-100", text: "text-indigo-700", gradient: "from-indigo-500 to-blue-400" },
  BUSINESS:  { bg: "bg-gray-100",   text: "text-gray-700",   gradient: "from-slate-500 to-gray-400" },
  COMEDY:    { bg: "bg-yellow-100", text: "text-yellow-700", gradient: "from-yellow-400 to-orange-400" },
  FILM:      { bg: "bg-violet-100", text: "text-violet-700", gradient: "from-violet-600 to-purple-500" },
  EDUCATION: { bg: "bg-teal-100",   text: "text-teal-700",   gradient: "from-teal-500 to-cyan-400" },
  OTHER:     { bg: "bg-gray-100",   text: "text-gray-600",   gradient: "from-gray-400 to-gray-500" },
};

export const AFRICAN_CITIES = [
  "Nairobi",
  "Lagos",
  "Accra",
  "Johannesburg",
  "Cape Town",
  "Cairo",
  "Kampala",
  "Dar es Salaam",
  "Kigali",
  "Addis Ababa",
  "Abuja",
  "Dakar",
];

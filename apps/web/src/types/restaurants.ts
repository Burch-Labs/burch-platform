import type {
  Restaurant,
  MenuItem,
  RestaurantReview,
  Partner,
  User,
  TableReservation,
} from "@prisma/client";

export type RestaurantCard = Restaurant & {
  partner: Pick<Partner, "id" | "name">;
  _count: { reviews: number; menuItems: number };
  reviews: Pick<RestaurantReview, "rating">[];
  avgRating: number | null;
};

export type RestaurantWithDetails = Restaurant & {
  partner: Partner & { user: Pick<User, "id" | "name" | "image"> };
  menuItems: MenuItem[];
  reviews: RestaurantReviewWithUser[];
  _count: { reviews: number; reservations: number };
  avgRating: number | null;
};

export type RestaurantReviewWithUser = RestaurantReview & {
  user: Pick<User, "id" | "name" | "image">;
};

export interface RestaurantFilters {
  q?: string;
  city?: string;
  cuisine?: string;
  page?: number;
}

export interface OpeningHoursDay {
  open: string;
  close: string;
  closed: boolean;
}

export interface OpeningHours {
  monday: OpeningHoursDay;
  tuesday: OpeningHoursDay;
  wednesday: OpeningHoursDay;
  thursday: OpeningHoursDay;
  friday: OpeningHoursDay;
  saturday: OpeningHoursDay;
  sunday: OpeningHoursDay;
}

export const PRICE_RANGE_LABELS: Record<number, string> = {
  1: "Budget",
  2: "Moderate",
  3: "Upscale",
  4: "Fine Dining",
};

export const PRICE_RANGE_SYMBOLS: Record<number, string> = {
  1: "KES",
  2: "KES KES",
  3: "KES KES KES",
  4: "KES KES KES KES",
};

export const MENU_CATEGORY_ORDER = [
  "Starters",
  "Soups & Salads",
  "Mains",
  "Grills",
  "Sides",
  "Desserts",
  "Cocktails",
  "Wines",
  "Drinks",
  "Juices",
];

export const RESTAURANT_AMENITIES = [
  "Outdoor Seating",
  "Private Dining",
  "Live Music",
  "Bar",
  "Vegan Options",
  "Vegetarian Options",
  "Halal",
  "WiFi",
  "Parking",
  "Wheelchair Accessible",
  "Takeaway",
  "Delivery",
  "Reservations Required",
  "Rooftop",
  "Waterfront",
] as const;

export const DAY_LABELS: Record<string, string> = {
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
};

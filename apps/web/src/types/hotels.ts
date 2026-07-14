import type { Hotel, Room, Partner, User, HotelReview, Booking } from "@prisma/client";

export type RoomWithBookings = Room & {
  _count: { bookings: number };
};

export type HotelWithDetails = Hotel & {
  partner: Partner & {
    user: Pick<User, "id" | "name" | "image">;
  };
  rooms: Room[];
  _count: { bookings: number; reviews: number };
  reviews: HotelReviewWithUser[];
  avgRating: number | null;
};

export type HotelCard = Hotel & {
  partner: Pick<Partner, "id" | "name">;
  _count: { rooms: number; reviews: number };
  rooms: Pick<Room, "price" | "currency">[];
  avgRating: number | null;
};

export type HotelReviewWithUser = HotelReview & {
  user: Pick<User, "id" | "name" | "image">;
};

export type RoomAvailability = Room & {
  availableCount: number;
  isAvailable: boolean;
};

export interface HotelFilters {
  q?: string;
  city?: string;
  stars?: number;
  page?: number;
}

export const HOTEL_AMENITIES = [
  "WiFi",
  "Swimming Pool",
  "Gym",
  "Restaurant",
  "Bar",
  "Spa",
  "Parking",
  "Airport Shuttle",
  "24h Front Desk",
  "Business Center",
  "Conference Rooms",
  "Room Service",
  "Laundry",
  "Concierge",
  "Kids Club",
  "Beach Access",
] as const;

export const ROOM_AMENITIES = [
  "Air Conditioning",
  "Flat-screen TV",
  "Mini Bar",
  "Safe",
  "Coffee Maker",
  "Bathtub",
  "Walk-in Shower",
  "Balcony",
  "City View",
  "Ocean View",
  "King Bed",
  "Twin Beds",
  "Sofa Bed",
  "Kitchenette",
  "Work Desk",
] as const;

export const BED_TYPES = [
  "King",
  "Queen",
  "Twin",
  "Double",
  "Single",
  "Bunk",
] as const;

export type BookingWithRoom = Booking & {
  room: Room | null;
  hotel: Hotel | null;
};

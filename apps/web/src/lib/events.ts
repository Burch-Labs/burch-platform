import { Event } from "@/types/event";

export const events: Event[] = [
  {
    id: "1",
    title: "Burna Boy Live",
    description: "Africa's biggest concert experience.",
    image: "/images/events/burna.jpg",
    category: "Concert",
    city: "Nairobi",
    venue: "KICC",
    startDate: "2026-08-20",
    endDate: "2026-08-20",
    price: 4500,
    currency: "KES",
  },
  {
    id: "2",
    title: "Safari Tech Summit",
    description: "Technology meets Africa.",
    image: "/images/events/tech.jpg",
    category: "Conference",
    city: "Kigali",
    venue: "Convention Centre",
    startDate: "2026-09-10",
    endDate: "2026-09-12",
    price: 7500,
    currency: "KES",
  },
];
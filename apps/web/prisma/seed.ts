import {
  PrismaClient,
  EventCategory,
  UserRole,
  PartnerStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

/**
 * ⚠️  READ THIS BEFORE POINTING THE SEED AT A PRODUCTION DATABASE
 *
 * The venues below are real, named businesses. Their names, cities,
 * neighbourhoods, cuisines and star tiers are accurate. Everything else —
 * room rates, menu prices, phone numbers, email addresses and every single
 * customer review — is invented demo content written to make development and
 * sales-demo screens look populated.
 *
 * Publishing invented prices or fabricated customer reviews attributed to a
 * real hotel or restaurant is not a cosmetic problem: fake reviews are
 * unlawful in many jurisdictions and wrong rates are a consumer-protection
 * issue. Every venue here needs its details confirmed by the partner, and its
 * reviews cleared out, before it is published to real users.
 *
 * Contact fields for venues added after the Nairobi expansion deliberately use
 * the reserved `.example` TLD so a placeholder can never resolve to a real
 * inbox or be dialled by mistake.
 */

// Shared placeholder imagery. Real listing photos are supplied by partners
// during onboarding; these exist so cards are not empty in development.
const HOTEL_IMG = {
  classic: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
  modern:  "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
  suite:   "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
  lobby:   "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
  pool:    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
};

const ROOM_IMG = {
  standard: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80",
  deluxe:   "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80",
  suite:    "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80",
};

const DINING_IMG = {
  fine:    "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
  casual:  "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
  grill:   "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
  bar:     "https://images.unsplash.com/photo-1470337458703-46ad1756a187?w=800&q=80",
};

// ─── Events ───────────────────────────────────────────────────────────────────

const EVENTS = [
  { title: "Nairobi Jazz Festival 2026", description: "The premier jazz festival in East Africa returns. Three stages, world-class artists, local cuisine, and Nairobi nights.", category: EventCategory.MUSIC, city: "Nairobi", location: "Ngong Racecourse, Ngong Road", price: 2500, capacity: 5000, daysFromNow: 14, durationHours: 8, tags: ["jazz", "festival", "outdoor"], imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80" },
  { title: "Nairobi AfroBeats Night", description: "The hottest Afrobeats night featuring live performances and DJ sets at the iconic Carnivore.", category: EventCategory.MUSIC, city: "Nairobi", location: "Carnivore Restaurant, Langata", price: 1200, capacity: 1500, daysFromNow: 9, durationHours: 6, tags: ["afrobeats", "nightlife"], imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Nairobi Street Food Festival", description: "Fifty of Nairobi's best food trucks and pop-up kitchens in one place — nyama choma, mutura, mandazi, and modern fusion, all under one roof.", category: EventCategory.FOOD_DRINK, city: "Nairobi", location: "Uhuru Gardens, Langata Road", price: 500, capacity: 6000, daysFromNow: 12, durationHours: 9, tags: ["food", "street food", "family friendly"], imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80" },
  { title: "Nairobi Beats & Culture Festival", description: "A day-long celebration of Kenyan sound — Genge, Gengetone, Benga, and Afro-fusion acts across two stages, plus local fashion and art vendors.", category: EventCategory.MUSIC, city: "Nairobi", location: "Kasarani Indoor Arena", price: 2000, capacity: 10000, daysFromNow: 20, durationHours: 8, tags: ["music", "culture", "live"], imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Nairobi Comedy Live", description: "Kenya's sharpest stand-up comedians for one night of nonstop laughs. Full bar, 18+.", category: EventCategory.COMEDY, city: "Nairobi", location: "Alliance Française, Loita Street", price: 800, capacity: 500, daysFromNow: 6, durationHours: 3, tags: ["comedy", "stand-up", "nightlife"], imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80" },
  { title: "Nairobi Startup & Innovation Summit", description: "East Africa's founders, investors, and policymakers under one roof — pitch competitions, panels on fintech and AgriTech, and investor speed-networking.", category: EventCategory.BUSINESS, city: "Nairobi", location: "KICC, City Square", price: 6000, capacity: 1500, daysFromNow: 35, durationHours: 8, tags: ["startup", "investment", "tech"], imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80" },
  { title: "Nairobi Half Marathon", description: "A scenic road race through the city's leafy suburbs finishing at Nyayo Stadium. Full, half, and 10K distances for every fitness level.", category: EventCategory.SPORTS, city: "Nairobi", location: "Nyayo National Stadium", price: 1500, capacity: 12000, daysFromNow: 40, durationHours: 5, tags: ["marathon", "running", "outdoor"], imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80" },
  { title: "Kenya Coffee & Culture Expo", description: "Meet the growers behind Kenya's world-famous AA beans — cupping sessions, barista competitions, and farm-to-cup talks from Nyeri and Kiambu estates.", category: EventCategory.FOOD_DRINK, city: "Nairobi", location: "Sarit Expo Centre, Westlands", price: 700, capacity: 2500, daysFromNow: 16, durationHours: 6, tags: ["coffee", "expo", "culture"], imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80" },
];

// ─── Hotels ───────────────────────────────────────────────────────────────────

const HOTELS = [
  {
    // Operated by Fairmont, not Serena — the previous seed had it on a
    // serena.co.ke address, conflating two separate groups.
    name: "Fairmont The Norfolk Nairobi", city: "Nairobi", location: "Harry Thuku Road, Nairobi", starRating: 5,
    description: "Nairobi's most iconic hotel since 1904. Colonial charm meets modern luxury, set in beautifully landscaped gardens in the heart of the city.",
    phone: "+254 20 000 0000", email: "reservations@fairmontnorfolk.example", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80","https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Room Service","Concierge"],
    rooms: [
      { name: "Superior Room", description: "Garden or pool view, king or twin beds.", price: 18500, currency: "KES", bedType: "King", maxGuests: 2, quantity: 20, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","Work Desk"] },
      { name: "Deluxe Room", description: "Premium furnishings, garden view, executive lounge access.", price: 28000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 15, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Balcony"] },
      { name: "Garden Suite", description: "Private garden terrace, separate living area, butler service.", price: 58000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 5, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","Balcony","Sofa Bed"] },
    ],
  },
  {
    name: "Sarova Stanley Nairobi", city: "Nairobi", location: "Corner Kimathi & Standard Street, CBD, Nairobi", starRating: 4,
    description: "A Nairobi institution since 1902. Colonial heritage meets contemporary comfort at the heart of the Central Business District.",
    phone: "+254 20 275 7000", email: "stanley@sarovahotels.com", checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Laundry","Concierge"],
    rooms: [
      { name: "Standard Room", description: "Classic furnishings, city views, all essential amenities.", price: 12000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 30, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker"] },
      { name: "Deluxe Room", description: "Upgraded room with premium bedding and city views.", price: 19000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 20, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","City View"] },
      { name: "Stanley Suite", description: "Historic suite spanning two floors with private dining and panoramic views.", price: 42000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 3, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Sofa Bed","Kitchenette"] },
    ],
  },
  {
    name: "Villa Rosa Kempinski Nairobi", city: "Nairobi", location: "Chiromo Road, Westlands, Nairobi", starRating: 5,
    description: "Nairobi's tallest and most opulent address. Rooftop infinity pool with skyline views, a dedicated Kids Club, and some of the largest guest rooms in East Africa.",
    phone: "+254 20 226 6000", email: "reservations.nairobi@kempinski.com", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Rooftop Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Concierge","Kids Club"],
    rooms: [
      { name: "Deluxe Room", description: "City views, marble bathroom, Kempinski signature bedding.", price: 26000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 40, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","City View"] },
      { name: "Executive Room", description: "Executive lounge access, upgraded views, and turndown service.", price: 36000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 20, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Lounge Access"] },
      { name: "Kempinski Suite", description: "Panoramic corner suite with separate living room and dining area.", price: 70000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 4, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","City View","Balcony"] },
    ],
  },
  {
    name: "Sankara Nairobi", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", starRating: 5,
    description: "A striking all-suite hotel in the heart of Westlands, part of Hilton's Curio Collection. Floor-to-ceiling windows, a rooftop pool bar, and Nairobi's buzziest brunch scene.",
    phone: "+254 703 049 000", email: "info.nairobi@sankara.com", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80","https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80"],
    amenities: ["WiFi","Rooftop Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Room Service","Concierge"],
    rooms: [
      { name: "Studio Suite", description: "All-suite living, floor-to-ceiling windows, kitchenette.", price: 24000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 35, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Kitchenette","City View"] },
      { name: "Executive Suite", description: "Larger living area, rooftop pool access, premium finishes.", price: 34000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 15, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Balcony"] },
    ],
  },
  {
    name: "Trademark Hotel", city: "Nairobi", location: "Church Road, Museum Hill, Nairobi", starRating: 5,
    description: "A design-forward five-star retreat next to Nairobi's Museum Hill, favoured by business travellers for its rooftop pool, wellness centre, and effortlessly modern rooms.",
    phone: "+254 709 878 000", email: "reservations@trademarkhotel.co.ke", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service"],
    rooms: [
      { name: "Classic Room", description: "Contemporary design, garden or pool views.", price: 20000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 30, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk"] },
      { name: "Premier Room", description: "Upgraded furnishings, pool view, rainfall shower.", price: 29000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 18, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Walk-in Shower","Pool View"] },
    ],
  },
  {
    name: "Hemingways Nairobi", city: "Nairobi", location: "Mbagathi Ridge, Karen, Nairobi", starRating: 5,
    description: "An intimate all-suite boutique hotel in leafy Karen, run to the exacting standards of the Relais & Châteaux collection, with views over the Ngong Hills.",
    phone: "+254 730 800 100", email: "reservations@hemingways-nairobi.com", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Spa","Restaurant","Bar","Gym","Parking","24h Front Desk","Concierge","Airport Shuttle"],
    rooms: [
      { name: "Junior Suite", description: "Garden views, private balcony, butler service on request.", price: 42000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 12, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Balcony","Garden View"] },
      { name: "Hemingways Suite", description: "Ngong Hills views, spacious living area, deep soaking tub.", price: 68000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 4, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Balcony","Hill View"] },
    ],
  },
  {
    name: "Tribe Hotel", city: "Nairobi", location: "Limuru Road, Gigiri, Nairobi", starRating: 5,
    description: "An art-filled design hotel in diplomatic Gigiri, close to the UN offices and Village Market. A favourite for its infinity pool, rooftop bar, and rotating contemporary African art collection.",
    phone: "+254 703 032 000", email: "reservations@tribe-hotel.com", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Room Service","Art Gallery"],
    rooms: [
      { name: "Tribe Room", description: "Contemporary African art, garden or pool views.", price: 23000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 30, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Pool View"] },
      { name: "Tribe Suite", description: "Expansive layout, private terrace, curated art pieces.", price: 45000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 6, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Balcony","Garden View"] },
    ],
  },
  {
    name: "Radisson Blu Hotel, Nairobi Upper Hill", city: "Nairobi", location: "Elgon Road, Upper Hill, Nairobi", starRating: 5,
    description: "A sleek business hotel in Nairobi's financial district, with panoramic city and Ngong Hills views from the rooftop pool and one of the largest ballrooms in East Africa.",
    phone: "+254 709 102 000", email: "info.upperhill.nairobi@radissonblu.com", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80","https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80","https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Airport Shuttle"],
    rooms: [
      { name: "Business Class Room", description: "Ergonomic workspace, city views, fast WiFi.", price: 21000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 45, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Executive Suite", description: "Separate lounge, executive floor access, Ngong Hills view.", price: 38000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 10, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Lounge Access"] },
    ],
  },
  {
    name: "Mövenpick Hotel & Residences Nairobi", city: "Nairobi", location: "Westlands Road, Nairobi", starRating: 5,
    description: "A contemporary Swiss-hospitality property in Westlands, known for its rooftop infinity pool, extensive dining options, and easy access to the CBD and Village Market.",
    phone: "+254 709 393 000", email: "reservations.nairobi@movenpick.com", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80","https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80"],
    amenities: ["WiFi","Rooftop Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Airport Shuttle"],
    rooms: [
      { name: "Classic Room", description: "Bright modern room, city views, Mövenpick signature bedding.", price: 19500, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 50, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","City View"] },
      { name: "Junior Suite", description: "Extra living space, rooftop pool access, premium bath amenities.", price: 32000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 12, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Balcony"] },
    ],
  },

  // ── Nairobi expansion ──────────────────────────────────────────────────────
  // Names, neighbourhoods and star tiers are accurate. Rates, phone numbers,
  // email addresses and reviews are ILLUSTRATIVE and must be replaced with
  // partner-supplied data before any of this is shown publicly. See the file
  // header for why that matters.
  {
    name: "Nairobi Serena Hotel", city: "Nairobi", location: "Processional Way, Central Business District, Nairobi", starRating: 5,
    description: "A city-centre landmark overlooking Central Park, known for its tranquil gardens, Maisha Spa and a long-standing reputation for polished service. A short walk from the KICC and the government quarter.",
    phone: "+254 20 282 2000", email: "nairobi@serenahotels.com", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.suite, HOTEL_IMG.lobby, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Concierge"],
    rooms: [
      { name: "Superior Room", description: "Park or city views, classic furnishings, generous work desk.", price: 19000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Executive Room", description: "Executive lounge access, upgraded bedding, park views.", price: 27000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 24, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Lounge Access"] },
      { name: "Serena Suite", description: "Separate living and dining areas overlooking Central Park.", price: 62000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 6, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","City View"] },
    ],
  },
  {
    name: "JW Marriott Hotel Nairobi", city: "Nairobi", location: "Global Trade Centre, Chiromo Road, Westlands, Nairobi", starRating: 5,
    description: "Occupying the upper floors of the Global Trade Centre tower, with some of the widest city views in Nairobi, a rooftop pool and several restaurants including a signature grill.",
    phone: "+254 20 000 0000", email: "reservations@jwmarriottnairobi.example", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.suite, HOTEL_IMG.pool, HOTEL_IMG.lobby],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Concierge","Airport Shuttle"],
    rooms: [
      { name: "Deluxe City View Room", description: "Floor-to-ceiling windows, marble bathroom, Marriott signature bedding.", price: 32000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 50, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","City View","Work Desk"] },
      { name: "Executive Suite", description: "Corner suite with separate lounge and executive floor privileges.", price: 68000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 12, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","City View","Lounge Access"] },
    ],
  },
  {
    name: "Pan Pacific Nairobi", city: "Nairobi", location: "Global Trade Centre, Chiromo Road, Westlands, Nairobi", starRating: 5,
    description: "Contemporary Asian-influenced hospitality in the Global Trade Centre complex, with serviced-apartment style residences alongside hotel rooms and direct access to the GTC mall.",
    phone: "+254 20 000 0000", email: "reservations@panpacificnairobi.example", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.modern, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Room Service","Laundry"],
    rooms: [
      { name: "Pacific Room", description: "Warm contemporary interiors with city or garden aspect.", price: 24000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 45, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","Work Desk"] },
      { name: "One-Bedroom Residence", description: "Full kitchen and living room — built for longer stays.", price: 41000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 20, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Kitchenette","Bathtub","City View"] },
    ],
  },
  {
    name: "Hyatt Regency Nairobi Westlands", city: "Nairobi", location: "Mpaka Road, Westlands, Nairobi", starRating: 5,
    description: "A polished Westlands business address with a rooftop pool, an all-day dining room and one of the larger ballroom and meeting floors in the area.",
    phone: "+254 20 000 0000", email: "nairobi.regency@hyatt.example", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.lobby, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Concierge"],
    rooms: [
      { name: "Regency King Room", description: "Contemporary room with generous desk and city outlook.", price: 26000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 55, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Regency Club Suite", description: "Club lounge access, separate sitting room, skyline views.", price: 55000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 10, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Lounge Access"] },
    ],
  },
  {
    name: "Hyatt House Nairobi Westlands", city: "Nairobi", location: "Mpaka Road, Westlands, Nairobi", starRating: 4,
    description: "Extended-stay sister property to the Regency, with kitchen-equipped studios and suites aimed at consultants, relocating families and anyone in town for more than a few nights.",
    phone: "+254 20 000 0000", email: "nairobi.house@hyatt.example", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.modern],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Parking","24h Front Desk","Laundry","Business Center","Kitchenette"],
    rooms: [
      { name: "Studio King", description: "Open-plan studio with full kitchen and sofa seating.", price: 15000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 40, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Kitchenette","Safe","Work Desk","Coffee Maker"] },
      { name: "One-Bedroom Suite", description: "Separate bedroom, living area and full kitchen.", price: 23000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 18, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Kitchenette","Safe","Sofa Bed","Bathtub"] },
    ],
  },
  {
    name: "Radisson Blu Hotel & Residence, Nairobi Arboretum", city: "Nairobi", location: "Arboretum Drive, Kilimani, Nairobi", starRating: 5,
    description: "Overlooking the Nairobi Arboretum, combining hotel rooms with long-stay residences. Greener and quieter than the Upper Hill business cluster, while still close to it.",
    phone: "+254 20 000 0000", email: "info.nairobi.arboretum@radissonblu.example", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.pool, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Room Service","Laundry"],
    rooms: [
      { name: "Superior Room", description: "Arboretum or city views, Radisson signature bedding.", price: 20000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 50, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","Garden View"] },
      { name: "Two-Bedroom Residence", description: "Family-sized apartment with kitchen, laundry and forest outlook.", price: 46000, currency: "KES", bedType: "King", maxGuests: 5, quantity: 14, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Kitchenette","Safe","Bathtub","Sofa Bed","Garden View"] },
    ],
  },
  {
    name: "Park Inn by Radisson Nairobi Westlands", city: "Nairobi", location: "Parklands Road, Westlands, Nairobi", starRating: 4,
    description: "Straightforward, well-kept mid-scale rooms in the middle of Westlands, with a rooftop bar and easy reach of the district's offices and restaurants.",
    phone: "+254 20 000 0000", email: "info.nairobi.westlands@parkinn.example", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.modern],
    amenities: ["WiFi","Gym","Restaurant","Bar","Parking","24h Front Desk","Business Center","Room Service","Laundry"],
    rooms: [
      { name: "Standard Room", description: "Bright, uncomplicated room with fast WiFi and a proper desk.", price: 11000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 70, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Work Desk","Coffee Maker"] },
      { name: "Superior Room", description: "Larger footprint with city views and a seating area.", price: 15500, currency: "KES", bedType: "King", maxGuests: 2, quantity: 30, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","City View","Work Desk"] },
    ],
  },
  {
    name: "Novotel Nairobi Westlands", city: "Nairobi", location: "Muthithi Road, Westlands, Nairobi", starRating: 4,
    description: "Accor's Westlands property, geared to business travellers and families alike, with flexible room layouts, an all-day restaurant and meeting space.",
    phone: "+254 20 000 0000", email: "reservations@novotelnairobi.example", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.lobby],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service"],
    rooms: [
      { name: "Superior Room", description: "Novotel's flexible layout with sofa bed and modular desk.", price: 13500, currency: "KES", bedType: "Queen", maxGuests: 3, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Sofa Bed","Work Desk","Coffee Maker"] },
      { name: "Executive Room", description: "Upgraded floor with lounge access and city views.", price: 21000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 22, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","City View","Lounge Access"] },
    ],
  },
  {
    name: "Kwetu Nairobi, Curio Collection by Hilton", city: "Nairobi", location: "Parklands Road, Westlands, Nairobi", starRating: 5,
    description: "A design-led Curio Collection property whose name means \"our home\" in Kiswahili — Kenyan craft and materials throughout, with a rooftop bar and a strong local food focus.",
    phone: "+254 20 000 0000", email: "reservations@kwetunairobi.example", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.modern, HOTEL_IMG.lobby],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Room Service","Concierge","Business Center"],
    rooms: [
      { name: "Kwetu King Room", description: "Kenyan textiles and timber, walk-in rain shower, city outlook.", price: 22000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 40, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Walk-in Shower","City View"] },
      { name: "Curio Suite", description: "Corner suite with a private terrace and commissioned Kenyan art.", price: 48000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 8, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Balcony","City View"] },
    ],
  },
  {
    name: "Jacaranda Hotel Nairobi", city: "Nairobi", location: "Chiromo Road, Westlands, Nairobi", starRating: 4,
    description: "A long-established Westlands hotel set in mature gardens, popular for conferences, family weekends and its well-known Sunday lunch.",
    phone: "+254 20 000 0000", email: "reservations@jacarandahotels.example", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Parking","24h Front Desk","Conference Rooms","Room Service","Laundry"],
    rooms: [
      { name: "Standard Room", description: "Garden-facing room with the essentials done properly.", price: 9500, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker","Garden View"] },
      { name: "Family Room", description: "Two double beds and space for children to spread out.", price: 16000, currency: "KES", bedType: "Double", maxGuests: 4, quantity: 20, imageUrl: ROOM_IMG.deluxe, amenities: ["Flat-screen TV","Safe","Coffee Maker","Garden View","Sofa Bed"] },
    ],
  },
  {
    name: "Gem Forest Hotel Nairobi", city: "Nairobi", location: "Gigiri, Nairobi", starRating: 4,
    description: "A quiet Gigiri address close to the UN complex and the diplomatic missions, favoured by visiting delegations for its calm setting and generous rooms.",
    phone: "+254 20 000 0000", email: "reservations@gemforesthotel.example", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Parking","24h Front Desk","Conference Rooms","Room Service","Airport Shuttle"],
    rooms: [
      { name: "Deluxe Room", description: "Spacious room with forest or garden aspect.", price: 14000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 45, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","Garden View"] },
      { name: "Executive Suite", description: "Separate lounge, ideal for delegations and long stays.", price: 27000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 10, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Garden View","Work Desk"] },
    ],
  },
  {
    name: "Safari Park Hotel & Casino", city: "Nairobi", location: "Thika Road, Kasarani, Nairobi", starRating: 5,
    description: "Sixty acres of tropical gardens on Thika Road, built as a village of thatched makuti roofs. Best known for the Nyama Choma Ranch and the long-running Safari Cats dinner show, and one of the largest conference capacities in the city.",
    phone: "+254 20 000 0000", email: "reservations@safariparkhotel.example", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.classic, HOTEL_IMG.lobby, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Conference Rooms","Business Center","Room Service","Casino","Airport Shuttle","Family Friendly"],
    rooms: [
      { name: "Superior Garden Room", description: "Makuti-roofed block set among the gardens, private verandah.", price: 16000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 80, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Garden View","Balcony"] },
      { name: "Executive Room", description: "Larger room closer to the pool deck, upgraded bathroom.", price: 24000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 40, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Garden View"] },
      { name: "Presidential Suite", description: "Multi-room suite with private garden and dedicated service.", price: 85000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 2, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","Garden View","Balcony","Kitchenette"] },
    ],
  },
  {
    name: "Nairobi Safari Club", city: "Nairobi", location: "Lillian Towers, University Way, Central Business District, Nairobi", starRating: 5,
    description: "An all-suite tower on University Way at the edge of the CBD, a short walk from the university and the National Museum. Every room is a suite, which makes it a long-standing choice for extended business stays.",
    phone: "+254 20 000 0000", email: "reservations@nairobisafariclub.example", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.lobby, HOTEL_IMG.classic],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Laundry"],
    rooms: [
      { name: "Executive Suite", description: "Separate sitting room and bedroom, city views over University Way.", price: 17000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 100, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Deluxe Suite", description: "Upper-floor suite with a larger lounge and dining table.", price: 26000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 30, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Work Desk"] },
    ],
  },
];

// ─── Restaurants ─────────────────────────────────────────────────────────────

const defaultHours = (open: string, close: string, sat = "10:00", satClose = "23:00") => ({
  monday: { open, close, closed: false },
  tuesday: { open, close, closed: false },
  wednesday: { open, close, closed: false },
  thursday: { open, close, closed: false },
  friday: { open, close: satClose, closed: false },
  saturday: { open: sat, close: satClose, closed: false },
  sunday: { open: sat, close, closed: false },
});

const RESTAURANTS = [
  {
    name: "The Talisman", city: "Nairobi", location: "320 Lower Kabete Road, Karen, Nairobi", cuisine: "Contemporary African",
    description: "Nestled in a colonial Karen farmhouse surrounded by lush gardens, The Talisman is widely regarded as Nairobi's finest dining experience. Each dish is a creative reinterpretation of African ingredients using modern techniques.",
    priceRange: 4, phone: "+254 20 386 1927", email: "reservations@talisman.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80"],
    amenities: ["Outdoor Seating","Private Dining","Bar","Parking","Reservations Required","Vegan Options"],
    openingHours: defaultHours("12:00", "22:00", "11:00", "22:30"),
    menuItems: [
      { category: "Starters", name: "Nyama Choma Salad", description: "Char-grilled beef, fresh greens, mango, and a tamarind dressing", price: 850, sortOrder: 1 },
      { category: "Starters", name: "Crab Samosas", description: "East African crab meat, fresh coriander, coconut chutney", price: 1100, sortOrder: 2 },
      { category: "Mains", name: "Tilapia on the Rocks", description: "Lake Victoria tilapia, sweet potato mash, sukuma wiki chimichurri", price: 2200, sortOrder: 1 },
      { category: "Mains", name: "Lamb Rack with Berbere", description: "French-trimmed Kenyan lamb, Ethiopian spice crust, roasted vegetables", price: 3800, sortOrder: 2 },
      { category: "Mains", name: "Garden Mezze", description: "A seasonal spread of African-inspired vegetarian delights", price: 1800, sortOrder: 3 },
      { category: "Desserts", name: "Passion Fruit Crème Brûlée", description: "Classic brûlée with East African passion fruit", price: 750, sortOrder: 1 },
      { category: "Desserts", name: "Chocolate Lava Cake", description: "Dark Ugandan chocolate, vanilla bean ice cream", price: 850, sortOrder: 2 },
      { category: "Cocktails", name: "African Sunset", description: "Gin, hibiscus, lime, ginger beer", price: 900, sortOrder: 1 },
      { category: "Cocktails", name: "Dawa Cocktail", description: "Vodka, honey, lime — Kenya's classic cocktail", price: 850, sortOrder: 2 },
      { category: "Wines", name: "Kleine Zalze Chenin Blanc", description: "South Africa · Stellenbosch · Glass", price: 950, sortOrder: 1 },
    ],
  },
  {
    name: "Kiza Lounge & Restaurant", city: "Nairobi", location: "Galana Plaza, Galana Road, Kilimani, Nairobi", cuisine: "Pan-African",
    description: "Kiza is Nairobi's most vibrant dining and nightlife destination. The kitchen serves bold, contemporary pan-African cuisine while the lounge transforms into the city's most exciting live music venue after dark.",
    priceRange: 3, phone: "+254 20 261 0069", email: "info@kizanairobi.com",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"],
    amenities: ["Live Music","Bar","Rooftop","Outdoor Seating","Vegan Options","Reservations Required"],
    openingHours: { ...defaultHours("18:00", "02:00", "18:00", "03:00"), monday: { open: "18:00", close: "02:00", closed: false }, tuesday: { open: "18:00", close: "02:00", closed: false } },
    menuItems: [
      { category: "Starters", name: "Prawns Peri-Peri", description: "Tiger prawns, Mozambican peri-peri sauce, grilled flatbread", price: 1800, sortOrder: 1 },
      { category: "Starters", name: "African Platter", description: "Samosas, chicken lollipops, spring rolls, mango chutney", price: 1400, sortOrder: 2 },
      { category: "Grills", name: "Kiza Mixed Grill", description: "Beef ribeye, lamb chops, chicken tikka, sides", price: 5500, sortOrder: 1 },
      { category: "Grills", name: "Nyama Choma", description: "Kenyan char-grilled goat, kachumbari, ugali", price: 2800, sortOrder: 2 },
      { category: "Mains", name: "Swahili Coconut Fish Curry", description: "Fresh sea bass, coconut milk, tomato, spiced rice", price: 2400, sortOrder: 1 },
      { category: "Cocktails", name: "Kiza Mojito", description: "White rum, fresh mint, lime, cane sugar", price: 1000, sortOrder: 1 },
      { category: "Cocktails", name: "Passion Martini", description: "Vodka, passion fruit, vanilla, prosecco float", price: 1100, sortOrder: 2 },
      { category: "Drinks", name: "Tusker Lager", description: "Kenya's iconic beer · 500ml", price: 450, sortOrder: 1 },
    ],
  },
  {
    name: "Carnivore Restaurant", city: "Nairobi", location: "Langata Road, Nairobi", cuisine: "Nyama Choma / African Grill",
    description: "Nairobi's most famous restaurant since 1980. An all-you-can-eat carnival of roasted meats carved tableside from a giant Maasai sword, around a legendary charcoal pit.",
    priceRange: 3, phone: "+254 20 605 933", email: "info@tamarind.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Outdoor Seating","Live Music","Bar","Parking","Reservations Required","Private Dining"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
    menuItems: [
      { category: "Carvery", name: "The Beast — Full Carvery Experience", description: "Unlimited tableside-carved meats: beef, lamb, pork, chicken, and seasonal game", price: 4200, sortOrder: 1 },
      { category: "Carvery", name: "Vegetarian Carvery", description: "Unlimited grilled vegetables, halloumi, and plant-based sides for non-meat eaters", price: 2600, sortOrder: 2 },
      { category: "Sides", name: "Sukuma Wiki & Ugali", description: "Sautéed kale, maize meal — the classic accompaniment", price: 0, sortOrder: 1 },
      { category: "Starters", name: "Soup of the Day", description: "Chef's daily selection, served with fresh bread", price: 650, sortOrder: 1 },
      { category: "Desserts", name: "Tropical Fruit Platter", description: "Mango, pineapple, passion fruit, papaya", price: 700, sortOrder: 1 },
      { category: "Cocktails", name: "Dawa Cocktail", description: "Vodka, honey, lime — Kenya's classic cocktail", price: 850, sortOrder: 1 },
      { category: "Drinks", name: "Tusker Lager", description: "Kenya's iconic beer · 500ml", price: 450, sortOrder: 2 },
    ],
  },
  {
    name: "About Thyme", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "International",
    description: "A long-standing Westlands favourite for relaxed, well-executed international dishes in a leafy garden setting — a go-to for weekday lunches and long weekend brunches.",
    priceRange: 3, phone: "+254 20 444 5599", email: "reservations@aboutthyme.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Vegetarian Options","Parking","Reservations Required"],
    openingHours: defaultHours("08:00", "22:00", "08:00", "22:30"),
    menuItems: [
      { category: "Breakfast", name: "Eggs Benedict", description: "Poached eggs, hollandaise, smoked salmon or bacon, English muffin", price: 1350, sortOrder: 1 },
      { category: "Starters", name: "Grilled Halloumi Salad", description: "Watermelon, mint, rocket, balsamic glaze", price: 900, sortOrder: 1 },
      { category: "Mains", name: "Beer-Battered Fish & Chips", description: "Fresh tilapia, hand-cut fries, tartare sauce", price: 1600, sortOrder: 1 },
      { category: "Mains", name: "Chicken Tikka Wrap", description: "Grilled chicken, mint yoghurt, pickled onion, fries", price: 1400, sortOrder: 2 },
      { category: "Mains", name: "Vegetable Lasagne", description: "Layered seasonal vegetables, béchamel, parmesan crust", price: 1500, sortOrder: 3 },
      { category: "Desserts", name: "Sticky Toffee Pudding", description: "Warm toffee sauce, vanilla ice cream", price: 750, sortOrder: 1 },
    ],
  },
  {
    name: "Cultiva Farm to Table", city: "Nairobi", location: "Karen, Nairobi", cuisine: "Farm-to-Table",
    description: "A garden restaurant built around its own working farm — herbs, vegetables, and eggs harvested steps from the kitchen, with a menu that changes with the season.",
    priceRange: 3, phone: "+254 20 800 1122", email: "hello@cultiva.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["Outdoor Seating","Vegan Options","Vegetarian Options","Kid Friendly","Parking","Farm Tours"],
    openingHours: defaultHours("08:00", "21:00", "08:00", "21:30"),
    menuItems: [
      { category: "Starters", name: "Garden Salad", description: "Same-day harvested greens, seed mix, citrus vinaigrette", price: 800, sortOrder: 1 },
      { category: "Mains", name: "Wood-Fired Vegetable Pizza", description: "Farm vegetables, mozzarella, basil, chilli oil", price: 1500, sortOrder: 1 },
      { category: "Mains", name: "Free-Range Roast Chicken", description: "Half chicken, farm potatoes, seasonal greens", price: 1900, sortOrder: 2 },
      { category: "Mains", name: "Grilled Trout", description: "Sagana farmed trout, lemon butter, herb rice", price: 2100, sortOrder: 3 },
      { category: "Desserts", name: "Farm Berry Crumble", description: "Seasonal berries, oat crumble, vanilla custard", price: 700, sortOrder: 1 },
      { category: "Drinks", name: "Fresh Pressed Juice", description: "Rotating seasonal blend from the farm", price: 500, sortOrder: 1 },
    ],
  },
  {
    name: "Seven Seafood & Grill", city: "Nairobi", location: "The Alchemist, Westlands, Nairobi", cuisine: "Seafood & Grill",
    description: "A stylish rooftop seafood and grill house above The Alchemist, known for fresh coastal catches flown in daily and a lively cocktail scene into the night.",
    priceRange: 4, phone: "+254 795 771 771", email: "bookings@sevennairobi.com",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80"],
    amenities: ["Rooftop","Live Music","Bar","Outdoor Seating","Reservations Required","Valet Parking"],
    openingHours: { ...defaultHours("17:00", "23:30", "12:00", "01:00"), sunday: { open: "12:00", close: "22:00", closed: false } },
    menuItems: [
      { category: "Starters", name: "Tuna Tataki", description: "Seared yellowfin tuna, sesame, ponzu, wasabi mayo", price: 1600, sortOrder: 1 },
      { category: "Starters", name: "Coconut Prawns", description: "Tempura prawns, coconut crumb, sweet chilli dip", price: 1500, sortOrder: 2 },
      { category: "Mains", name: "Whole Grilled Coastal Snapper", description: "Charcoal-grilled, coconut rice, kachumbari", price: 3200, sortOrder: 1 },
      { category: "Mains", name: "Seven Surf & Turf", description: "Grilled prawns, sirloin steak, garlic butter, fries", price: 3800, sortOrder: 2 },
      { category: "Sushi", name: "Rainbow Roll", description: "Assorted sashimi, avocado, cream cheese", price: 1900, sortOrder: 1 },
      { category: "Cocktails", name: "Passion Fruit Mojito", description: "White rum, passion fruit, mint, lime", price: 1000, sortOrder: 1 },
    ],
  },
  {
    name: "Mediterraneo Restaurant", city: "Nairobi", location: "Lenana Road, Kilimani, Nairobi", cuisine: "Italian",
    description: "A neighbourhood Italian trattoria loved for its wood-fired pizzas, homemade pasta, and unpretentious garden courtyard — a Kilimani classic for decades.",
    priceRange: 2, phone: "+254 20 271 6273", email: "info@mediterraneo.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"],
    amenities: ["Outdoor Seating","Vegetarian Options","Parking","Kid Friendly","Takeaway"],
    openingHours: defaultHours("11:30", "22:00", "11:30", "22:30"),
    menuItems: [
      { category: "Pizza", name: "Margherita", description: "San Marzano tomato, fior di latte, fresh basil", price: 1100, sortOrder: 1 },
      { category: "Pizza", name: "Quattro Formaggi", description: "Mozzarella, gorgonzola, parmesan, taleggio", price: 1400, sortOrder: 2 },
      { category: "Pasta", name: "Spaghetti Carbonara", description: "Guanciale, egg yolk, pecorino, black pepper", price: 1350, sortOrder: 1 },
      { category: "Pasta", name: "Pappardelle al Ragù", description: "Slow-cooked beef ragù, wide ribbon pasta, parmesan", price: 1550, sortOrder: 2 },
      { category: "Desserts", name: "Tiramisu", description: "Classic espresso-soaked sponge, mascarpone", price: 650, sortOrder: 1 },
      { category: "Wines", name: "Chianti Classico", description: "Tuscany · Glass", price: 900, sortOrder: 1 },
    ],
  },
  {
    name: "Nyama Mama", city: "Nairobi", location: "The Prism, Westlands, Nairobi", cuisine: "Modern Kenyan",
    description: "A vibrant modern take on Kenyan comfort food — think elevated nyama choma, matumbo, and mursik, served in a colourful, Instagram-ready space.",
    priceRange: 2, phone: "+254 709 601 000", email: "hello@nyamamama.com",
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Vegetarian Options","Delivery","Kid Friendly"],
    openingHours: defaultHours("07:30", "22:00", "07:30", "22:30"),
    menuItems: [
      { category: "Breakfast", name: "Mandazi & Mursik French Toast", description: "Kenyan-style french toast, fermented milk cream, honey", price: 900, sortOrder: 1 },
      { category: "Starters", name: "Mishkaki Skewers", description: "Marinated beef skewers, tamarind glaze", price: 850, sortOrder: 1 },
      { category: "Mains", name: "Nyama Choma Platter", description: "Mixed grilled meats, ugali, kachumbari, sukuma wiki", price: 2400, sortOrder: 1 },
      { category: "Mains", name: "Coastal Coconut Beans", description: "Kunde greens, coconut, chapati", price: 1200, sortOrder: 2 },
      { category: "Desserts", name: "Mango Cheesecake", description: "Kenyan mango, biscuit base, passion fruit coulis", price: 700, sortOrder: 1 },
      { category: "Drinks", name: "Dawa Mocktail", description: "Honey, lime, ginger, crushed ice", price: 550, sortOrder: 1 },
    ],
  },
  {
    name: "Onami Restaurant", city: "Nairobi", location: "General Mathenge Drive, Westlands, Nairobi", cuisine: "Japanese",
    description: "Nairobi's most established Japanese restaurant — sushi, teppanyaki, and robata grill in a serene, minimalist dining room.",
    priceRange: 4, phone: "+254 733 616 161", email: "reservations@onami.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Private Dining","Bar","Parking","Reservations Required","Vegetarian Options"],
    openingHours: { ...defaultHours("12:00", "22:30", "12:00", "23:00"), monday: { open: "18:00", close: "22:30", closed: false } },
    menuItems: [
      { category: "Sushi", name: "Onami Signature Roll", description: "Tempura shrimp, avocado, spicy mayo, tobiko", price: 1700, sortOrder: 1 },
      { category: "Sushi", name: "Sashimi Moriawase", description: "Chef's selection of the day's freshest fish", price: 2400, sortOrder: 2 },
      { category: "Teppanyaki", name: "Wagyu Beef Teppanyaki", description: "Grilled tableside, garlic rice, seasonal vegetables", price: 4500, sortOrder: 1 },
      { category: "Robata", name: "Chicken Yakitori Skewers", description: "Charcoal-grilled, tare glaze", price: 1200, sortOrder: 1 },
      { category: "Mains", name: "Miso Black Cod", description: "48-hour marinated cod, sweet miso glaze", price: 3600, sortOrder: 1 },
      { category: "Drinks", name: "Hot Sake", description: "House selection · Carafe", price: 1400, sortOrder: 1 },
    ],
  },
  {
    name: "K'Osewe Ranalo Foods", city: "Nairobi", location: "Koinange Street, CBD, Nairobi", cuisine: "Kenyan / Luo",
    description: "The city's best-loved home for authentic Luo cuisine — fresh tilapia, omena, and traditional greens served exactly as they would be in Nyanza.",
    priceRange: 1, phone: "+254 20 224 1234", email: "info@kosewe.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80","https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"],
    amenities: ["Takeaway","WiFi","Halal Options","Vegetarian Options"],
    openingHours: defaultHours("07:00", "21:00", "07:00", "21:00"),
    menuItems: [
      { category: "Fish", name: "Whole Fried Tilapia", description: "Lake Victoria tilapia, ugali, kachumbari, greens", price: 1200, sortOrder: 1 },
      { category: "Fish", name: "Fish Stew", description: "Tilapia in tomato and onion sauce, served with rice or ugali", price: 950, sortOrder: 2 },
      { category: "Traditional", name: "Omena with Sukuma", description: "Silver cyprinid, sautéed kale, tomato", price: 550, sortOrder: 1 },
      { category: "Traditional", name: "Managu & Ugali", description: "African nightshade greens, maize meal", price: 400, sortOrder: 2 },
      { category: "Sides", name: "Ugali", description: "Kenyan staple maize meal", price: 100, sortOrder: 1 },
      { category: "Drinks", name: "Fresh Passion Juice", description: "Pressed to order", price: 300, sortOrder: 1 },
    ],
  },
  {
    name: "Java House", city: "Nairobi", location: "Junction Mall, Ngong Road, Nairobi", cuisine: "Café / American",
    description: "Kenya's original coffee house chain — the go-to for a proper cappuccino, all-day breakfast, and reliable comfort food across the city.",
    priceRange: 2, phone: "+254 709 830 000", email: "customercare@javahouseafrica.com",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["WiFi","Outdoor Seating","Takeaway","Delivery","Kid Friendly","Vegetarian Options"],
    openingHours: defaultHours("06:30", "22:00", "06:30", "22:30"),
    menuItems: [
      { category: "Breakfast", name: "Java Breakfast", description: "Eggs any style, bacon, sausage, toast, hash browns", price: 950, sortOrder: 1 },
      { category: "Coffee", name: "Cappuccino", description: "Java's signature blend, steamed milk", price: 380, sortOrder: 1 },
      { category: "Mains", name: "Chicken Caesar Salad", description: "Grilled chicken, cos lettuce, parmesan, croutons", price: 1100, sortOrder: 1 },
      { category: "Mains", name: "Java Beef Burger", description: "Beef patty, cheddar, fries", price: 1250, sortOrder: 2 },
      { category: "Desserts", name: "Chocolate Brownie", description: "Warm, served with vanilla ice cream", price: 550, sortOrder: 1 },
    ],
  },
  {
    name: "Artcaffe", city: "Nairobi", location: "The Oval, Westlands, Nairobi", cuisine: "Café / Bakery",
    description: "A stylish bakery-café known for its fresh pastries, all-day brunch menu, and consistently excellent coffee — a Nairobi mainstay for over a decade.",
    priceRange: 2, phone: "+254 709 902 000", email: "info@artcaffe.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["WiFi","Outdoor Seating","Takeaway","Delivery","Vegetarian Options","Vegan Options"],
    openingHours: defaultHours("06:30", "21:30", "06:30", "22:00"),
    menuItems: [
      { category: "Bakery", name: "Butter Croissant", description: "Freshly baked in-house daily", price: 350, sortOrder: 1 },
      { category: "Breakfast", name: "Avocado Toast", description: "Sourdough, smashed avocado, feta, chilli flakes", price: 850, sortOrder: 1 },
      { category: "Mains", name: "Grilled Salmon Salad", description: "Pan-seared salmon, mixed greens, citrus dressing", price: 1600, sortOrder: 1 },
      { category: "Mains", name: "Margherita Flatbread", description: "Tomato, mozzarella, basil", price: 1050, sortOrder: 2 },
      { category: "Desserts", name: "Red Velvet Cake", description: "Cream cheese frosting", price: 600, sortOrder: 1 },
    ],
  },
  {
    name: "Mama Rocks Burgers", city: "Nairobi", location: "Delta Corner, Westlands, Nairobi", cuisine: "American / Burgers",
    description: "Nairobi's original gourmet burger joint — thick, juicy, made-to-order patties with a build-your-own topping bar and hand-cut fries.",
    priceRange: 2, phone: "+254 700 555 111", email: "hello@mamarocks.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Outdoor Seating","Takeaway","Delivery","Kid Friendly","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
    menuItems: [
      { category: "Burgers", name: "The OG Rocks Burger", description: "Beef patty, cheddar, bacon, secret sauce, brioche bun", price: 1100, sortOrder: 1 },
      { category: "Burgers", name: "Spicy Chicken Burger", description: "Buttermilk fried chicken, jalapeños, chipotle mayo", price: 1050, sortOrder: 2 },
      { category: "Burgers", name: "Beyond Veggie Burger", description: "Plant-based patty, lettuce, tomato, vegan mayo", price: 1150, sortOrder: 3 },
      { category: "Sides", name: "Loaded Fries", description: "Cheese sauce, bacon bits, spring onion", price: 700, sortOrder: 1 },
      { category: "Shakes", name: "Oreo Milkshake", description: "Vanilla ice cream, crushed Oreo", price: 650, sortOrder: 1 },
    ],
  },
  {
    name: "Habesha Restaurant", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "Ethiopian",
    description: "An authentic Ethiopian dining experience — communal platters of injera and richly spiced stews, served in a warm, traditionally decorated space with live cultural music on weekends.",
    priceRange: 2, phone: "+254 20 444 0321", email: "info@habesharestaurant.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"],
    amenities: ["Live Music","Vegan Options","Vegetarian Options","Outdoor Seating","Private Dining"],
    openingHours: defaultHours("11:00", "22:30", "11:00", "23:00"),
    menuItems: [
      { category: "Platters", name: "Habesha Mixed Platter", description: "Doro wat, tibs, misir wat, gomen — served on injera", price: 2200, sortOrder: 1 },
      { category: "Vegan", name: "Vegetarian Combo", description: "Five vegan stews on injera — lentils, split peas, cabbage, beets, greens", price: 1600, sortOrder: 1 },
      { category: "Mains", name: "Doro Wat", description: "Spiced chicken stew, boiled egg, berbere sauce", price: 1500, sortOrder: 1 },
      { category: "Mains", name: "Kitfo", description: "Ethiopian-style minced beef, mitmita spice, injera", price: 1800, sortOrder: 2 },
      { category: "Drinks", name: "Ethiopian Coffee Ceremony", description: "Traditionally roasted and brewed, serves two", price: 900, sortOrder: 1 },
    ],
  },
  {
    name: "Osteria del Chianti", city: "Nairobi", location: "General Mathenge Drive, Westlands, Nairobi", cuisine: "Italian",
    description: "A refined, intimate Italian osteria specialising in handmade pasta and an extensive Tuscan wine list, run by an Italian-trained kitchen team.",
    priceRange: 3, phone: "+254 733 222 444", email: "reservations@osteriadelchianti.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],
    amenities: ["Reservations Required","Bar","Outdoor Seating","Vegetarian Options","Private Dining"],
    openingHours: { ...defaultHours("12:00", "22:00", "12:00", "22:30"), monday: { open: "12:00", close: "22:00", closed: true } },
    menuItems: [
      { category: "Antipasti", name: "Burrata e Prosciutto", description: "Creamy burrata, San Daniele prosciutto, rocket", price: 1500, sortOrder: 1 },
      { category: "Pasta", name: "Tagliatelle al Tartufo", description: "Handmade tagliatelle, black truffle cream", price: 2400, sortOrder: 1 },
      { category: "Pasta", name: "Risotto ai Funghi", description: "Porcini mushroom risotto, parmesan crisp", price: 1900, sortOrder: 2 },
      { category: "Mains", name: "Osso Buco", description: "Braised veal shank, saffron risotto milanese", price: 3200, sortOrder: 1 },
      { category: "Desserts", name: "Panna Cotta", description: "Vanilla bean, berry coulis", price: 700, sortOrder: 1 },
      { category: "Wines", name: "Chianti Riserva", description: "Tuscany · Bottle", price: 4500, sortOrder: 1 },
    ],
  },
  {
    name: "Le Grenier à Pain", city: "Nairobi", location: "Riverside Drive, Nairobi", cuisine: "French Bakery & Bistro",
    description: "A true French bakery and bistro — flaky croissants, real baguettes, and classic bistro plates, run with unmistakable Parisian precision.",
    priceRange: 3, phone: "+254 20 444 7788", email: "info@legrenier.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Takeaway","Vegetarian Options","Parking"],
    openingHours: defaultHours("06:30", "21:00", "07:00", "21:00"),
    menuItems: [
      { category: "Bakery", name: "Butter Croissant", description: "Laminated 36 hours, baked fresh each morning", price: 380, sortOrder: 1 },
      { category: "Bakery", name: "Baguette Tradition", description: "Classic French baguette", price: 300, sortOrder: 2 },
      { category: "Mains", name: "Croque Monsieur", description: "Ham, gruyère, béchamel, toasted brioche", price: 1200, sortOrder: 1 },
      { category: "Mains", name: "Steak Frites", description: "Grilled sirloin, herb butter, hand-cut fries", price: 2600, sortOrder: 2 },
      { category: "Desserts", name: "Crème Brûlée", description: "Classic vanilla bean, caramelised sugar crust", price: 750, sortOrder: 1 },
      { category: "Drinks", name: "Café au Lait", description: "Double espresso, steamed milk", price: 400, sortOrder: 1 },
    ],
  },
  {
    name: "Charcoal Grill Woodvale", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "Grill / Nyama Choma",
    description: "A no-frills, always-packed Westlands grill house famous for its charcoal-roasted meats and lively weekend crowd — a favourite for casual nights out.",
    priceRange: 2, phone: "+254 733 909 090", email: "bookings@charcoalgrill.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
    amenities: ["Outdoor Seating","Live Music","Bar","Parking","Takeaway"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "01:00"),
    menuItems: [
      { category: "Grill", name: "Mixed Nyama Choma Platter", description: "Beef, goat, chicken, ugali, kachumbari", price: 2000, sortOrder: 1 },
      { category: "Grill", name: "Grilled Tilapia", description: "Whole fish, ugali, greens", price: 1400, sortOrder: 2 },
      { category: "Starters", name: "Chicken Wings", description: "Peri-peri or BBQ glaze", price: 900, sortOrder: 1 },
      { category: "Sides", name: "Sukuma Wiki", description: "Sautéed kale, tomato, onion", price: 350, sortOrder: 1 },
      { category: "Drinks", name: "Tusker Lager", description: "500ml", price: 400, sortOrder: 1 },
    ],
  },
  {
    name: "Fogo Gaucho Brazilian Steakhouse", city: "Nairobi", location: "Rosslyn Riviera, Nairobi", cuisine: "Brazilian Steakhouse",
    description: "Nairobi's take on the Brazilian churrascaria — endless tableside-carved cuts of beef, lamb, and chicken, paired with a full salad and hot bar.",
    priceRange: 4, phone: "+254 709 555 200", email: "reservations@fogogaucho.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Private Dining","Bar","Parking","Reservations Required","Outdoor Seating"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
    menuItems: [
      { category: "Rodizio", name: "Full Rodizio Experience", description: "Unlimited tableside-carved picanha, lamb, chicken, sausage, plus hot & salad bar", price: 4500, sortOrder: 1 },
      { category: "Rodizio", name: "Salad & Hot Bar Only", description: "Full buffet access without the meat carvery", price: 2200, sortOrder: 2 },
      { category: "Starters", name: "Pão de Queijo", description: "Brazilian cheese bread, served warm", price: 600, sortOrder: 1 },
      { category: "Desserts", name: "Brigadeiro", description: "Brazilian chocolate truffles", price: 500, sortOrder: 1 },
      { category: "Cocktails", name: "Caipirinha", description: "Cachaça, lime, sugar", price: 1000, sortOrder: 1 },
    ],
  },
  {
    name: "Symphony Restaurant & Lounge", city: "Nairobi", location: "Yaya Centre, Kilimani, Nairobi", cuisine: "International Fusion",
    description: "A sleek, upscale lounge above Yaya Centre with a broad international menu, sushi bar, and a rooftop terrace that turns into one of Kilimani's liveliest evening spots.",
    priceRange: 3, phone: "+254 709 700 500", email: "hello@symphonynairobi.com",
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],
    amenities: ["Rooftop","Live Music","Bar","Outdoor Seating","Vegetarian Options","Reservations Required"],
    openingHours: { ...defaultHours("12:00", "23:00", "12:00", "01:00"), sunday: { open: "12:00", close: "22:00", closed: false } },
    menuItems: [
      { category: "Starters", name: "Crispy Calamari", description: "Lightly fried squid, chilli aioli", price: 1300, sortOrder: 1 },
      { category: "Sushi", name: "Dragon Roll", description: "Tempura prawn, eel, avocado, unagi sauce", price: 1800, sortOrder: 1 },
      { category: "Mains", name: "Grilled Ribeye", description: "300g ribeye, garlic butter, truffle fries", price: 3400, sortOrder: 1 },
      { category: "Mains", name: "Thai Green Curry", description: "Chicken or vegetable, jasmine rice", price: 1700, sortOrder: 2 },
      { category: "Cocktails", name: "Symphony Signature", description: "Gin, elderflower, cucumber, prosecco", price: 1100, sortOrder: 1 },
    ],
  },
  {
    name: "Ocean Basket", city: "Nairobi", location: "The Junction Mall, Ngong Road, Nairobi", cuisine: "Seafood",
    description: "The Nairobi outpost of the popular pan-African seafood chain — fresh calamari, prawns, and fish served in a casual, family-friendly setting.",
    priceRange: 2, phone: "+254 709 830 500", email: "junction@oceanbasket.co.ke",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["Kid Friendly","Takeaway","Delivery","WiFi","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
    menuItems: [
      { category: "Starters", name: "Calamari Heads", description: "Lightly floured and fried, lemon butter sauce", price: 950, sortOrder: 1 },
      { category: "Platters", name: "Ocean Basket Platter for Two", description: "Prawns, calamari, fish, mussels — serves two", price: 3600, sortOrder: 1 },
      { category: "Mains", name: "Grilled Kingklip", description: "Lemon butter, rice, seasonal vegetables", price: 1900, sortOrder: 1 },
      { category: "Mains", name: "Prawn Linguine", description: "Garlic, chilli, white wine, parsley", price: 1800, sortOrder: 2 },
      { category: "Desserts", name: "Malva Pudding", description: "Warm sponge pudding, custard", price: 550, sortOrder: 1 },
    ],
  },

  // ── Nairobi expansion: current openings ────────────────────────────────────
  // Same caveat as the hotels above — names, neighbourhoods and cuisines are
  // accurate, prices and reviews are illustrative.
  {
    name: "INTI", city: "Nairobi", location: "One Africa Place, Waiyaki Way, Westlands, Nairobi", cuisine: "Japanese-Peruvian",
    description: "Nikkei cooking twenty floors above Westlands — the Japanese-Peruvian tradition of ceviche, tiradito and robata, plated with the most ambitious kitchen technique in the city and a skyline to match.",
    priceRange: 4, phone: "+254 20 000 0000", email: "reservations@inti.example",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.bar, DINING_IMG.casual],
    amenities: ["Rooftop","Bar","Reservations Required","Private Dining","Valet Parking","Vegetarian Options"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "00:00"),
    menuItems: [
      { category: "Ceviche & Tiradito", name: "Ceviche Clásico", description: "Line-caught white fish, leche de tigre, sweet potato, choclo", price: 1950, sortOrder: 1 },
      { category: "Ceviche & Tiradito", name: "Tiradito Nikkei", description: "Thin-sliced tuna, yuzu ponzu, rocoto, micro shiso", price: 2200, sortOrder: 2 },
      { category: "Robata", name: "Miso Black Cod", description: "Saikyo-marinated cod, hoba leaf, pickled ginger", price: 4200, sortOrder: 1 },
      { category: "Robata", name: "Anticucho Beef Skewers", description: "Peruvian-spiced fillet, aji panca glaze", price: 2800, sortOrder: 2 },
      { category: "Sushi", name: "Nikkei Signature Roll", description: "Soft-shell crab, avocado, aji amarillo aioli", price: 2400, sortOrder: 1 },
      { category: "Desserts", name: "Lucuma Cheesecake", description: "Peruvian lucuma, torched meringue", price: 950, sortOrder: 1 },
      { category: "Cocktails", name: "Pisco Sour", description: "Quebranta pisco, lime, egg white, angostura", price: 1200, sortOrder: 1 },
    ],
  },
  {
    name: "Ankole Grill", city: "Nairobi", location: "Kitisuru, Nairobi", cuisine: "African Steakhouse",
    description: "Named for the long-horned cattle breed of the Great Lakes, Ankole makes the case for an East African steakhouse — dry-aged local beef over open flame, in a garden setting in Kitisuru.",
    priceRange: 3, phone: "+254 20 000 0000", email: "kitisuru@ankolegrill.example",
    imageUrl: DINING_IMG.grill, images: [DINING_IMG.grill, DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Live Music","Private Dining","Family Friendly"],
    openingHours: defaultHours("12:00", "22:30", "11:00", "23:00"),
    menuItems: [
      { category: "From the Grill", name: "Ankole Ribeye", description: "Dry-aged local ribeye, bone marrow butter, 400g", price: 3800, sortOrder: 1 },
      { category: "From the Grill", name: "Ankole Tomahawk", description: "Sharing cut for two, chimichurri, grilled onion", price: 7500, sortOrder: 2 },
      { category: "From the Grill", name: "Nyama Choma Platter", description: "Goat, beef and chicken, kachumbari, ugali", price: 3200, sortOrder: 3 },
      { category: "Starters", name: "Grilled Bone Marrow", description: "Roasted marrow, parsley salad, sourdough toast", price: 1250, sortOrder: 1 },
      { category: "Sides", name: "Charred Sukuma", description: "Collard greens, garlic, smoked chilli", price: 550, sortOrder: 1 },
      { category: "Desserts", name: "Grilled Pineapple", description: "Fire-roasted pineapple, vanilla ice cream, honey", price: 700, sortOrder: 1 },
    ],
  },
  {
    name: "Shamba Café", city: "Nairobi", location: "Karen, Nairobi", cuisine: "Health & Brunch",
    description: "An all-day Karen café built around locally sourced produce — grain bowls, cold-press juices and a shop selling the same farm goods the kitchen cooks with.",
    priceRange: 2, phone: "+254 20 000 0000", email: "hello@shambacafe.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Takeaway","Parking","Vegan Options","Vegetarian Options","Gluten-Free Options","Family Friendly"],
    openingHours: defaultHours("07:30", "18:00", "08:00", "18:00"),
    menuItems: [
      { category: "Breakfast", name: "Farm Eggs & Sourdough", description: "Two farm eggs, avocado, house sourdough, dukkah", price: 1100, sortOrder: 1 },
      { category: "Breakfast", name: "Shamba Granola Bowl", description: "House granola, farm yoghurt, seasonal fruit, hive honey", price: 850, sortOrder: 2 },
      { category: "Bowls", name: "Harvest Grain Bowl", description: "Ancient grains, roast vegetables, tahini, seeds", price: 1250, sortOrder: 1 },
      { category: "Juices", name: "Cold-Press Green", description: "Kale, cucumber, apple, ginger, lime", price: 600, sortOrder: 1 },
      { category: "Coffee", name: "Kenyan Single Origin", description: "Rotating single-estate Kenyan AA", price: 400, sortOrder: 1 },
    ],
  },

  // ── Cuisine specialists ────────────────────────────────────────────────────
  {
    name: "Haandi", city: "Nairobi", location: "The Mall, Westlands, Nairobi", cuisine: "North Indian",
    description: "North-West Frontier cooking that has held its Westlands following for decades — tandoor breads, slow-cooked dals and karahi dishes finished at the pass.",
    priceRange: 3, phone: "+254 20 000 0000", email: "westlands@haandi.example",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Parking","Takeaway","Private Dining","Vegetarian Options","Vegan Options","Halal"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
    menuItems: [
      { category: "Tandoor", name: "Murgh Malai Tikka", description: "Cream and cheese marinated chicken, green chilli", price: 1650, sortOrder: 1 },
      { category: "Tandoor", name: "Seekh Kebab", description: "Minced lamb, ginger, coriander, char-grilled", price: 1750, sortOrder: 2 },
      { category: "Curries", name: "Butter Chicken", description: "Tandoori chicken, tomato and fenugreek gravy", price: 1850, sortOrder: 1 },
      { category: "Curries", name: "Dal Haandi", description: "Black lentils simmered overnight, cream, butter", price: 1200, sortOrder: 2 },
      { category: "Curries", name: "Karahi Gosht", description: "Mutton, tomato, green chilli, finished in the karahi", price: 2100, sortOrder: 3 },
      { category: "Breads", name: "Garlic Naan", description: "Tandoor-baked, garlic and coriander butter", price: 400, sortOrder: 1 },
    ],
  },
  {
    name: "Misono", city: "Nairobi", location: "Lavington, Nairobi", cuisine: "Japanese",
    description: "A quiet Lavington Japanese room doing teppanyaki tables, a small sushi counter and a proper ramen bowl — the city's most complete Japanese offering.",
    priceRange: 3, phone: "+254 20 000 0000", email: "reservations@misono.example",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Parking","Private Dining","Reservations Required","Vegetarian Options","Takeaway"],
    openingHours: defaultHours("12:00", "22:00", "12:00", "22:30"),
    menuItems: [
      { category: "Sushi", name: "Chef's Nigiri Selection", description: "Eight pieces, whatever came in best that morning", price: 2800, sortOrder: 1 },
      { category: "Sushi", name: "Salmon Avocado Roll", description: "Eight pieces, sesame, house soy", price: 1400, sortOrder: 2 },
      { category: "Teppanyaki", name: "Teppanyaki Beef Set", description: "Fillet cooked at the table, rice, miso, vegetables", price: 3600, sortOrder: 1 },
      { category: "Ramen", name: "Tonkotsu Ramen", description: "Twelve-hour pork bone broth, chashu, ajitama", price: 1650, sortOrder: 1 },
      { category: "Starters", name: "Agedashi Tofu", description: "Crisp silken tofu, dashi broth, spring onion", price: 850, sortOrder: 1 },
    ],
  },

  // ── Hotel signature restaurants ────────────────────────────────────────────
  {
    name: "Sarabi Rooftop — Sankara Nairobi", city: "Nairobi", location: "Sankara Nairobi, Woodvale Grove, Westlands, Nairobi", cuisine: "Pan-African",
    description: "Sankara's rooftop pool deck and grill, and the Westlands address for closing a deal over nyama choma with a view. Sunset service is the one to book.",
    priceRange: 4, phone: "+254 20 000 0000", email: "sarabi@sankara.example",
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.grill, DINING_IMG.fine],
    amenities: ["Rooftop","Bar","Outdoor Seating","Live Music","Valet Parking","Reservations Required","Pool Access"],
    openingHours: defaultHours("11:00", "23:00", "11:00", "00:00"),
    menuItems: [
      { category: "Grill", name: "Sarabi Nyama Choma", description: "Goat ribs, kachumbari, ugali — the house order", price: 2900, sortOrder: 1 },
      { category: "Grill", name: "Peri-Peri Chicken", description: "Half chicken, Mozambican peri-peri, charred lemon", price: 2200, sortOrder: 2 },
      { category: "Small Plates", name: "Coast Prawns", description: "Tiger prawns, coconut, tamarind, coriander", price: 2400, sortOrder: 1 },
      { category: "Cocktails", name: "Dawa", description: "Vodka, honey, lime — the Kenyan classic, done well", price: 1100, sortOrder: 1 },
      { category: "Cocktails", name: "Sarabi Sundowner", description: "Gin, hibiscus, passion fruit, tonic", price: 1250, sortOrder: 2 },
    ],
  },
  {
    name: "Jiko — Tribe Hotel", city: "Nairobi", location: "Tribe Hotel, Limuru Road, Gigiri, Nairobi", cuisine: "Contemporary African",
    description: "Tribe's signature dining room, built as a tribute to Kenyan growers — organic produce, a playful hand with presentation, and one of the more thoughtful African menus in the city.",
    priceRange: 4, phone: "+254 20 000 0000", email: "jiko@tribe-hotel.example",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Outdoor Seating","Private Dining","Valet Parking","Reservations Required","Vegetarian Options","Vegan Options"],
    openingHours: defaultHours("06:30", "22:30", "07:00", "23:00"),
    menuItems: [
      { category: "Starters", name: "Smoked Lake Fish Rillette", description: "Lake Victoria fish, farm herbs, sourdough crisp", price: 1500, sortOrder: 1 },
      { category: "Starters", name: "Roast Beet & Goat Cheese", description: "Limuru beets, goat cheese, honey, dukkah", price: 1300, sortOrder: 2 },
      { category: "Mains", name: "Braised Short Rib", description: "Kenyan beef, sweet potato, wild greens jus", price: 3400, sortOrder: 1 },
      { category: "Mains", name: "Coconut Fish Curry", description: "Coastal curry, coconut rice, green mango salad", price: 2800, sortOrder: 2 },
      { category: "Mains", name: "Farm Vegetable Plate", description: "Whatever the growers sent, cooked three ways", price: 2100, sortOrder: 3 },
      { category: "Desserts", name: "Dark Chocolate & Baobab", description: "Ganache, baobab sorbet, cacao nib", price: 950, sortOrder: 1 },
    ],
  },
  {
    name: "Lucca — Villa Rosa Kempinski", city: "Nairobi", location: "Villa Rosa Kempinski, Chiromo Road, Westlands, Nairobi", cuisine: "Italian",
    description: "Kempinski's Italian dining room, and the most formal of the hotel's eight venues — house-made pasta, a serious cellar, and service pitched at the old-school end.",
    priceRange: 4, phone: "+254 20 000 0000", email: "lucca@kempinski.example",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.bar],
    amenities: ["Bar","Private Dining","Valet Parking","Reservations Required","Wine List","Vegetarian Options"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
    menuItems: [
      { category: "Antipasti", name: "Vitello Tonnato", description: "Rose veal, tuna emulsion, capers", price: 1900, sortOrder: 1 },
      { category: "Primi", name: "Tagliolini al Tartufo", description: "Fresh tagliolini, black truffle, parmesan", price: 3200, sortOrder: 1 },
      { category: "Primi", name: "Risotto ai Funghi", description: "Carnaroli, wild mushroom, aged grana", price: 2400, sortOrder: 2 },
      { category: "Secondi", name: "Branzino in Crosta", description: "Salt-baked sea bass, lemon, olive oil", price: 3800, sortOrder: 1 },
      { category: "Desserts", name: "Panna Cotta", description: "Vanilla panna cotta, macerated berries", price: 900, sortOrder: 1 },
      { category: "Wines", name: "Chianti Classico Riserva", description: "Tuscany · Glass", price: 1400, sortOrder: 1 },
    ],
  },
  {
    name: "Harvest — Trademark Hotel", city: "Nairobi", location: "Trademark Hotel, Church Road, Museum Hill, Nairobi", cuisine: "International",
    description: "Trademark's all-day dining room off the atrium — a strong breakfast buffet, a working lunch menu, and a poolside terrace that gets the afternoon sun.",
    priceRange: 3, phone: "+254 20 000 0000", email: "harvest@trademark.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Bar","Valet Parking","Buffet","Family Friendly","Vegetarian Options"],
    openingHours: defaultHours("06:30", "22:30", "07:00", "23:00"),
    menuItems: [
      { category: "Breakfast", name: "Full Breakfast Buffet", description: "Hot and cold stations, eggs to order, Kenyan coffee", price: 2400, sortOrder: 1 },
      { category: "Lunch", name: "Business Lunch Set", description: "Two courses and a soft drink, served inside forty minutes", price: 2200, sortOrder: 1 },
      { category: "Mains", name: "Grilled Tilapia", description: "Lake fish, coconut rice, kachumbari", price: 2300, sortOrder: 1 },
      { category: "Mains", name: "Beef Burger", description: "Kenyan beef, aged cheddar, hand-cut chips", price: 1800, sortOrder: 2 },
      { category: "Desserts", name: "Passion Fruit Tart", description: "Shortcrust, passion curd, torched meringue", price: 750, sortOrder: 1 },
    ],
  },
  {
    name: "Osteria Romana Terrazo — Sankara Nairobi", city: "Nairobi", location: "Sankara Nairobi, Woodvale Grove, Westlands, Nairobi", cuisine: "Italian",
    description: "The terrace-level Italian at Sankara — Roman classics served from lunch through dinner, spilling onto a covered terrace over Woodvale Grove.",
    priceRange: 3, phone: "+254 20 000 0000", email: "osteriaromana@sankara.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Valet Parking","Reservations Required","Vegetarian Options","Wine List"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
    menuItems: [
      { category: "Antipasti", name: "Carciofi alla Romana", description: "Braised artichokes, mint, garlic", price: 1250, sortOrder: 1 },
      { category: "Pasta", name: "Cacio e Pepe", description: "Tonnarelli, pecorino romano, cracked pepper", price: 1750, sortOrder: 1 },
      { category: "Pasta", name: "Amatriciana", description: "Guanciale, tomato, pecorino", price: 1850, sortOrder: 2 },
      { category: "Secondi", name: "Saltimbocca alla Romana", description: "Veal, prosciutto, sage, white wine", price: 3200, sortOrder: 1 },
      { category: "Desserts", name: "Maritozzo", description: "Roman sweet bun, whipped cream", price: 700, sortOrder: 1 },
    ],
  },

  // ── Hotel dining ───────────────────────────────────────────────────────────
  {
    name: "Nyama Choma Ranch — Safari Park Hotel", city: "Nairobi", location: "Safari Park Hotel, Thika Road, Kasarani, Nairobi", cuisine: "Grill / Nyama Choma",
    description: "The open-sided grill at the heart of Safari Park's gardens, and one of the city's benchmark nyama choma addresses — meat carved to the table, served alongside the Safari Cats dinner show.",
    priceRange: 3, phone: "+254 20 000 0000", email: "nyamachoma@safariparkhotel.example",
    imageUrl: DINING_IMG.grill, images: [DINING_IMG.grill, DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Live Music","Family Friendly","Group Dining","Buffet"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "23:30"),
    menuItems: [
      { category: "From the Grill", name: "Ranch Mixed Grill", description: "Goat, beef, lamb and chicken carved at the table", price: 3400, sortOrder: 1 },
      { category: "From the Grill", name: "Goat Ribs", description: "Slow-grilled over charcoal, kachumbari, ugali", price: 2400, sortOrder: 2 },
      { category: "From the Grill", name: "Whole Roast Chicken", description: "Marinated overnight, charcoal-roasted", price: 2100, sortOrder: 3 },
      { category: "Sides", name: "Ugali & Sukuma", description: "Stone-ground maize, collard greens", price: 500, sortOrder: 1 },
      { category: "Show Package", name: "Safari Cats Dinner & Show", description: "Buffet dinner with the evening acrobatic and dance performance", price: 5200, sortOrder: 1 },
      { category: "Cocktails", name: "Dawa", description: "Vodka, honey, lime", price: 950, sortOrder: 1 },
    ],
  },

  // ── Mall dining ────────────────────────────────────────────────────────────
  {
    name: "Hero Restaurant", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "International",
    description: "The comic-themed dining room at Village Market, built around four house characters. Broad international menu, a long wine list, and a room that works equally for a family lunch or an after-work bottle.",
    priceRange: 3, phone: "+254 20 000 0000", email: "hello@heronairobi.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Bar","Outdoor Seating","Parking","Family Friendly","Wine List","Takeaway","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:30", "10:00", "23:00"),
    menuItems: [
      { category: "Starters", name: "Chef Chops Platter", description: "Wings, sliders, calamari, dips — the house sharer", price: 1850, sortOrder: 1 },
      { category: "Mains", name: "Hero Ribeye", description: "300g ribeye, peppercorn sauce, hand-cut chips", price: 3200, sortOrder: 1 },
      { category: "Mains", name: "Spyce Chicken Curry", description: "Coconut curry, basmati, warm naan", price: 1750, sortOrder: 2 },
      { category: "Mains", name: "Big Mama Burger", description: "Double Kenyan beef patty, aged cheddar, bacon jam", price: 1650, sortOrder: 3 },
      { category: "Desserts", name: "Honeytooth Sundae", description: "Salted caramel, brownie, vanilla ice cream", price: 800, sortOrder: 1 },
    ],
  },
  {
    name: "Golden Stool", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "West African",
    description: "West African cooking at Village Market — jollof, egusi, suya and grilled shrimp, in a room dressed with Ashanti motifs. The most complete Ghanaian and Nigerian menu in Nairobi.",
    priceRange: 2, phone: "+254 20 000 0000", email: "hello@goldenstool.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Bar","Parking","Takeaway","Private Dining","Family Friendly","Halal"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
    menuItems: [
      { category: "Starters", name: "Suya Skewers", description: "Beef, groundnut and chilli spice, raw onion", price: 1200, sortOrder: 1 },
      { category: "Starters", name: "Grilled Shrimp", description: "West African spice rub, charred lime", price: 1650, sortOrder: 2 },
      { category: "Mains", name: "Jollof Rice & Chicken", description: "Smoky party jollof, grilled chicken, fried plantain", price: 1450, sortOrder: 1 },
      { category: "Mains", name: "Egusi & Pounded Yam", description: "Melon-seed stew, spinach, goat meat", price: 1600, sortOrder: 2 },
      { category: "Mains", name: "Waakye", description: "Rice and beans, shito, boiled egg, gari", price: 1250, sortOrder: 3 },
      { category: "Desserts", name: "Puff Puff", description: "Fried dough, cinnamon sugar", price: 550, sortOrder: 1 },
    ],
  },
  {
    name: "Sierra Lounge Yaya", city: "Nairobi", location: "Yaya Centre, Argwings Kodhek Road, Kilimani, Nairobi", cuisine: "Grill / Brewery",
    description: "House-brewed lager and ale alongside a wood-fired grill, on the top level of Yaya Centre. The reliable Kilimani choice for a long lunch that becomes an evening.",
    priceRange: 3, phone: "+254 20 000 0000", email: "yaya@sierralounge.example",
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.grill, DINING_IMG.casual],
    amenities: ["Bar","Outdoor Seating","Parking","Live Music","Sports Screens","Takeaway","Brewery"],
    openingHours: defaultHours("11:00", "23:00", "11:00", "00:00"),
    menuItems: [
      { category: "Grill", name: "Sierra Pork Ribs", description: "Half rack, house ale glaze, slaw, fries", price: 2400, sortOrder: 1 },
      { category: "Grill", name: "Mixed Grill Platter", description: "Beef, chicken, sausage, wings — serves two", price: 3600, sortOrder: 2 },
      { category: "Small Plates", name: "Buffalo Wings", description: "Eight wings, blue cheese dip", price: 1250, sortOrder: 1 },
      { category: "Brews", name: "Sierra Blonde Ale", description: "Brewed on site · 500ml", price: 600, sortOrder: 1 },
      { category: "Brews", name: "Sierra Dark Lager", description: "Brewed on site · 500ml", price: 650, sortOrder: 2 },
    ],
  },
  {
    name: "Café Deli The Hub", city: "Nairobi", location: "The Hub Karen, Dagoretti Road, Karen, Nairobi", cuisine: "Café / Kenyan",
    description: "The Karen branch of the homegrown all-day café — Kenyan breakfasts, a strong pastry counter and a menu that runs from ugali to pasta without apology.",
    priceRange: 2, phone: "+254 20 000 0000", email: "thehub@cafedeli.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Parking","Takeaway","Family Friendly","Vegetarian Options","Breakfast"],
    openingHours: defaultHours("07:00", "22:00", "07:30", "22:00"),
    menuItems: [
      { category: "Breakfast", name: "Kenyan Breakfast", description: "Eggs, beef sausage, baked beans, toast, chai", price: 950, sortOrder: 1 },
      { category: "Breakfast", name: "Mandazi & Chai", description: "Four mandazi, spiced Kenyan tea", price: 450, sortOrder: 2 },
      { category: "Mains", name: "Nyama Choma & Ugali", description: "Grilled goat, ugali, kachumbari", price: 1350, sortOrder: 1 },
      { category: "Mains", name: "Chicken Alfredo", description: "Grilled chicken, cream sauce, fettuccine", price: 1250, sortOrder: 2 },
      { category: "Pastry", name: "Passion Fruit Cheesecake", description: "From the counter, made daily", price: 600, sortOrder: 1 },
    ],
  },
  {
    name: "Chowpaty", city: "Nairobi", location: "Diamond Plaza, Masari Road, Parklands, Nairobi", cuisine: "Indian Vegetarian",
    description: "Parklands' long-standing pure-vegetarian Indian kitchen — Mumbai street chaat, South Indian dosas and Gujarati thalis, at Diamond Plaza.",
    priceRange: 1, phone: "+254 20 000 0000", email: "info@chowpaty.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Takeaway","Parking","Family Friendly","Vegetarian Options","Vegan Options","Group Dining"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
    menuItems: [
      { category: "Chaat", name: "Pani Puri", description: "Six puris, spiced water, tamarind chutney", price: 450, sortOrder: 1 },
      { category: "Chaat", name: "Bhel Puri", description: "Puffed rice, chutneys, sev, coriander", price: 400, sortOrder: 2 },
      { category: "Dosa", name: "Masala Dosa", description: "Crisp rice crepe, spiced potato, sambar, chutneys", price: 700, sortOrder: 1 },
      { category: "Thali", name: "Gujarati Thali", description: "Unlimited — dal, kadhi, two sabzis, rotli, rice, sweet", price: 1200, sortOrder: 1 },
      { category: "Drinks", name: "Masala Chai", description: "Brewed with cardamom and ginger", price: 200, sortOrder: 1 },
    ],
  },

  // ── Nightlife ──────────────────────────────────────────────────────────────
  // No dedicated venue type in the schema yet, so lounges and clubs sit under
  // restaurants with a Club & Lounge cuisine so they group in the filter.
  {
    name: "B-Club Nairobi", city: "Nairobi", location: "Galana Plaza, Galana Road, Kilimani, Nairobi", cuisine: "Club & Lounge",
    description: "Nairobi's highest-end nightclub — bottle service, a strict door and a room that fills with the city's celebrity crowd well after midnight. Table reservations are effectively required at weekends.",
    priceRange: 4, phone: "+254 20 000 0000", email: "tables@bclubnairobi.example",
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual],
    amenities: ["Bar","VIP Tables","Bottle Service","Valet Parking","Live DJ","Reservations Required","Dress Code","Late Night"],
    openingHours: defaultHours("21:00", "04:00", "21:00", "05:00"),
    menuItems: [
      { category: "Tables", name: "VIP Table — Main Floor", description: "Seats six, minimum spend applies", price: 60000, sortOrder: 1 },
      { category: "Tables", name: "Standard Table", description: "Seats four, minimum spend applies", price: 35000, sortOrder: 2 },
      { category: "Bottles", name: "Champagne — Brut NV", description: "Presented to table", price: 28000, sortOrder: 1 },
      { category: "Bottles", name: "Premium Whisky", description: "Bottle with mixers and ice", price: 22000, sortOrder: 2 },
      { category: "Cocktails", name: "Signature Cocktail", description: "From the house list", price: 1400, sortOrder: 1 },
    ],
  },
  {
    name: "Mercury Lounge Village Market", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "Club & Lounge",
    description: "Cocktail bar, restaurant and weekend DJ room in one — and the most reliable place in Nairobi to catch a live rhythm section on a weeknight rather than a playlist.",
    priceRange: 3, phone: "+254 20 000 0000", email: "gigiri@mercurylounge.example",
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Bar","Outdoor Seating","Live Music","Parking","Late Night","Reservations Required","Vegetarian Options"],
    openingHours: defaultHours("12:00", "01:00", "12:00", "02:00"),
    menuItems: [
      { category: "Small Plates", name: "Salt & Pepper Squid", description: "Crisp squid, chilli, lime aioli", price: 1450, sortOrder: 1 },
      { category: "Small Plates", name: "Beef Sliders", description: "Three sliders, aged cheddar, house pickle", price: 1350, sortOrder: 2 },
      { category: "Mains", name: "Grilled Sea Bass", description: "Whole fish, herb butter, seasonal greens", price: 2900, sortOrder: 1 },
      { category: "Cocktails", name: "Old Fashioned", description: "Bourbon, demerara, bitters, orange oil", price: 1300, sortOrder: 1 },
      { category: "Cocktails", name: "Espresso Martini", description: "Vodka, Kenyan espresso, coffee liqueur", price: 1250, sortOrder: 2 },
    ],
  },
  {
    name: "The Alchemist Bar", city: "Nairobi", location: "Parklands Road, Westlands, Nairobi", cuisine: "Club & Lounge",
    description: "The open-air Westlands courtyard that reset Nairobi nightlife — food trucks around a container bar, a proper stage, and a rotation of live bands, DJ sets, comedy and fashion nights.",
    priceRange: 2, phone: "+254 20 000 0000", email: "hello@alchemist.example",
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Bar","Outdoor Seating","Live Music","Live DJ","Food Trucks","Parking","Late Night","Family Friendly"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "03:00"),
    menuItems: [
      { category: "Food Trucks", name: "Street Tacos", description: "Three tacos from the rotating truck line-up", price: 900, sortOrder: 1 },
      { category: "Food Trucks", name: "Loaded Fries", description: "Beef, cheese sauce, jalapeño", price: 750, sortOrder: 2 },
      { category: "Drinks", name: "Draught Beer", description: "500ml, rotating local tap", price: 450, sortOrder: 1 },
      { category: "Drinks", name: "Gin & Tonic", description: "Kenyan gin, tonic, grapefruit", price: 850, sortOrder: 2 },
      { category: "Entry", name: "Event Entry", description: "Cover varies by act — free on most weeknights", price: 1500, sortOrder: 1 },
    ],
  },
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding dontbeboring database…\n");

  // Users
  const [eventP1User, eventP2User, hotelPartnerUser, restaurantPartnerUser, adminUser, customerUser] =
    await Promise.all([
      prisma.user.upsert({ where: { email: "events@dontbeboring.example" }, update: {}, create: { name: "dontbeboring Events Co.", email: "events@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "continental@dontbeboring.example" }, update: {}, create: { name: "Continental Productions", email: "continental@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "hotels@dontbeboring.example" }, update: {}, create: { name: "dontbeboring Hotels", email: "hotels@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "dining@dontbeboring.example" }, update: {}, create: { name: "dontbeboring Dining", email: "dining@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "admin@dontbeboring.example" }, update: {}, create: { name: "Admin", email: "admin@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.ADMIN, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "customer@dontbeboring.example" }, update: {}, create: { name: "Alex Osei", email: "customer@dontbeboring.example", password: await hash("Password123!", 12), role: UserRole.CUSTOMER, emailVerified: new Date() } }),
    ]);

  // Partners
  const [eventP1, eventP2, hotelPartner, restaurantPartner] = await Promise.all([
    prisma.partner.upsert({ where: { userId: eventP1User.id }, update: {}, create: { userId: eventP1User.id, name: "dontbeboring Events Co.", description: "East Africa's leading event management company.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: eventP2User.id }, update: {}, create: { userId: eventP2User.id, name: "Continental Productions", description: "From Lagos to Nairobi, we produce unforgettable experiences.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: hotelPartnerUser.id }, update: {}, create: { userId: hotelPartnerUser.id, name: "dontbeboring Hotels Collection", description: "Curating East Africa's finest hotel experiences.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: restaurantPartnerUser.id }, update: {}, create: { userId: restaurantPartnerUser.id, name: "dontbeboring Dining Group", description: "East Africa's premier restaurant collection.", status: PartnerStatus.APPROVED } }),
  ]);

  // Seed events
  let eventsCreated = 0;
  const eventPartners = [eventP1, eventP2];
  for (let i = 0; i < EVENTS.length; i++) {
    const e = EVENTS[i];
    const partner = eventPartners[i % 2];
    const existing = await prisma.event.findFirst({ where: { title: e.title, partnerId: partner.id } });
    if (!existing) {
      const startDate = new Date(); startDate.setDate(startDate.getDate() + e.daysFromNow); startDate.setHours(18, 0, 0, 0);
      const endDate = new Date(startDate); endDate.setHours(startDate.getHours() + e.durationHours);
      const { daysFromNow: _d, durationHours: _h, ...eventData } = e;
      await prisma.event.create({ data: { partnerId: partner.id, ...eventData, startDate, endDate, currency: "KES", published: true } });
      eventsCreated++;
    }
  }

  // Seed hotels
  let hotelsCreated = 0;
  for (const h of HOTELS) {
    const existing = await prisma.hotel.findFirst({ where: { name: h.name } });
    if (!existing) {
      const hotel = await prisma.hotel.create({ data: { partnerId: hotelPartner.id, name: h.name, description: h.description, city: h.city, location: h.location, starRating: h.starRating, phone: h.phone, email: h.email, checkInTime: h.checkInTime, checkOutTime: h.checkOutTime, imageUrl: h.imageUrl, images: h.images, amenities: h.amenities, published: true } });
      for (const r of h.rooms) await prisma.room.create({ data: { hotelId: hotel.id, ...r, available: true } });
      // No seeded reviews. Ratings belong to real guests after a real stay;
      // inventing them for a named hotel is both misleading and unlawful in
      // many markets. The review tables and UI stay live for post-launch use.
      hotelsCreated++;
    }
  }

  // Seed restaurants
  let restaurantsCreated = 0;
  for (const r of RESTAURANTS) {
    const existing = await prisma.restaurant.findFirst({ where: { name: r.name } });
    if (!existing) {
      const restaurant = await prisma.restaurant.create({ data: { partnerId: restaurantPartner.id, name: r.name, description: r.description, city: r.city, location: r.location, cuisine: r.cuisine, priceRange: r.priceRange, phone: r.phone, email: r.email, imageUrl: r.imageUrl, images: r.images, amenities: r.amenities, openingHours: r.openingHours, published: true } });
      for (let i = 0; i < r.menuItems.length; i++) {
        const m = r.menuItems[i];
        await prisma.menuItem.create({ data: { restaurantId: restaurant.id, name: m.name, description: m.description, price: m.price, currency: "KES", category: m.category, sortOrder: m.sortOrder ?? i, available: true } });
      }
      // No seeded reviews — see the note in the hotel loop above.
      restaurantsCreated++;
    }
  }

  console.log(`✅  ${eventsCreated} events seeded (${EVENTS.length - eventsCreated} already existed)`);
  console.log(`✅  ${hotelsCreated} hotels seeded   (${HOTELS.length - hotelsCreated} already existed)`);
  console.log(`✅  ${restaurantsCreated} restaurants seeded (${RESTAURANTS.length - restaurantsCreated} already existed)`);
  console.log("\n📋 Demo accounts (all password: Password123!)");
  console.log("   admin@dontbeboring.example     → Admin");
  console.log("   events@dontbeboring.example    → Events Partner");
  console.log("   hotels@dontbeboring.example    → Hotels Partner");
  console.log("   dining@dontbeboring.example    → Dining Partner");
  console.log("   customer@dontbeboring.example  → Customer");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
    website: "https://www.fairmont.com/en/hotels/nairobi/fairmont-the-norfolk.html",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    website: "https://www.sarovahotels.com/stanley-nairobi/",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
    website: "https://www.tribe-hotel.com/",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
    website: "https://www.serenahotels.com/nairobi",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "12:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
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
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.lobby, HOTEL_IMG.classic],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Conference Rooms","Room Service","Laundry"],
    rooms: [
      { name: "Executive Suite", description: "Separate sitting room and bedroom, city views over University Way.", price: 17000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 100, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Deluxe Suite", description: "Upper-floor suite with a larger lounge and dining table.", price: 26000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 30, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Work Desk"] },
    ],
  },

  // ── Coast: Mombasa ─────────────────────────────────────────────────────────
  {
    name: "Serena Beach Resort & Spa", city: "Mombasa", location: "Shanzu Beach, North Coast, Mombasa", starRating: 5,
    description: "Built as a replica of a fourteenth-century Swahili town, with carved doors, coral-rag walls and winding lanes opening onto Shanzu Beach. The North Coast benchmark for its gardens and its spa.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.classic, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Beach Access","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Room Service","Water Sports","Family Friendly"],
    rooms: [
      { name: "Superior Garden Room", description: "Swahili-styled room among the coastal gardens.", price: 18000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Garden View","Balcony"] },
      { name: "Ocean View Room", description: "Direct Indian Ocean outlook, steps from the sand.", price: 27000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 30, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Ocean View","Balcony"] },
    ],
  },
  {
    name: "Sarova Whitesands Beach Resort & Spa", city: "Mombasa", location: "Bamburi Beach, North Coast, Mombasa", starRating: 5,
    description: "A long stretch of Bamburi beachfront with five pools, a full water-sports centre and a reputation as the family choice on the North Coast.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    website: "https://www.sarovahotels.com/whitesands-mombasa/",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Beach Access","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Water Sports","Kids Club","Family Friendly"],
    rooms: [
      { name: "Standard Room", description: "Garden-facing room a short walk from the pools.", price: 13000, currency: "KES", bedType: "Queen", maxGuests: 3, quantity: 90, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Garden View"] },
      { name: "Sea Facing Room", description: "Balcony over the beach, upgraded furnishings.", price: 21000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 45, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Ocean View","Balcony"] },
    ],
  },
  {
    name: "Voyager Beach Resort", city: "Mombasa", location: "Nyali Beach, Mombasa", starRating: 4,
    description: "Nautically themed all-inclusive on Nyali Beach, laid out like a ship's deck. Popular for its dive centre and its evening entertainment programme.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Beach Access","Restaurant","Bar","Parking","24h Front Desk","Water Sports","Kids Club","All Inclusive","Family Friendly"],
    rooms: [
      { name: "Standard Room", description: "Compact cabin-style room, garden or pool aspect.", price: 11500, currency: "KES", bedType: "Queen", maxGuests: 3, quantity: 70, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Garden View"] },
      { name: "Sea View Room", description: "Upper-deck room facing the Indian Ocean.", price: 17500, currency: "KES", bedType: "King", maxGuests: 3, quantity: 35, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Safe","Ocean View","Balcony"] },
    ],
  },

  // ── Coast: Diani ───────────────────────────────────────────────────────────
  {
    name: "Swahili Beach Resort", city: "Diani", location: "Diani Beach Road, Diani, Kwale", starRating: 5,
    description: "Monumental Swahili and Omani architecture set behind one of the best stretches of Diani sand — vaulted lobbies, layered pools and a spa built into the coral.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.lobby, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Beach Access","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Room Service","Water Sports","Concierge"],
    rooms: [
      { name: "Deluxe Room", description: "Carved timber, garden or pool views, deep verandah.", price: 22000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 50, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Garden View","Balcony"] },
      { name: "Ocean Suite", description: "Sea-facing suite with private plunge pool.", price: 52000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 12, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Ocean View","Balcony","Private Pool"] },
    ],
  },
  {
    name: "Leopard Beach Resort & Spa", city: "Diani", location: "Diani Beach Road, Diani, Kwale", starRating: 4,
    description: "Long-established Diani resort on a cliff above the beach, with terraced gardens running down to the sand and one of the coast's better-known spas.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Beach Access","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Water Sports","Family Friendly"],
    rooms: [
      { name: "Superior Room", description: "Garden-facing room in the terraced blocks.", price: 14000, currency: "KES", bedType: "Queen", maxGuests: 3, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Garden View"] },
      { name: "Ocean Front Cottage", description: "Standalone cottage on the seaward edge of the gardens.", price: 29000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 15, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Ocean View","Balcony","Sofa Bed"] },
    ],
  },

  // ── Coast: Malindi ─────────────────────────────────────────────────────────
  {
    name: "Diamonds Dream of Africa", city: "Malindi", location: "Casuarina Road, Malindi, Kilifi", starRating: 5,
    description: "Adults-only boutique resort on Malindi's beachfront, with a strong Italian influence in both the kitchen and the clientele.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.suite, images: [HOTEL_IMG.suite, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Beach Access","Restaurant","Bar","Spa","Parking","24h Front Desk","Room Service","Adults Only","All Inclusive"],
    rooms: [
      { name: "Junior Suite", description: "Garden suite with four-poster bed and outdoor shower.", price: 24000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 30, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Garden View","Balcony"] },
      { name: "Beachfront Suite", description: "Direct sea frontage, private terrace and daybed.", price: 42000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 10, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Ocean View","Balcony"] },
    ],
  },
  {
    name: "Ocean Beach Resort & Spa Malindi", city: "Malindi", location: "Mama Ngina Road, Malindi, Kilifi", starRating: 4,
    description: "Wide gardens and a long pool running toward the Malindi shoreline, with a dive school and easy access to the marine park.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.classic],
    amenities: ["WiFi","Swimming Pool","Beach Access","Restaurant","Bar","Spa","Parking","24h Front Desk","Water Sports","Family Friendly"],
    rooms: [
      { name: "Garden Room", description: "Set among palms, a short walk to the beach.", price: 10500, currency: "KES", bedType: "Queen", maxGuests: 3, quantity: 45, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Garden View"] },
      { name: "Sea View Room", description: "Upper-floor room with an ocean-facing balcony.", price: 16000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 20, imageUrl: ROOM_IMG.deluxe, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Ocean View","Balcony"] },
    ],
  },

  // ── Rift Valley: Naivasha ──────────────────────────────────────────────────
  {
    name: "Enashipai Resort & Spa", city: "Naivasha", location: "Moi South Lake Road, Naivasha, Nakuru County", starRating: 5,
    description: "The benchmark Naivasha resort — extensive grounds off South Lake Road, a large spa and conference capacity that makes it the default for corporate retreats out of Nairobi.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.pool, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Conference Rooms","Room Service","Lake Access","Family Friendly"],
    rooms: [
      { name: "Deluxe Room", description: "Generous room opening onto the lawns.", price: 19000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 70, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Garden View","Balcony"] },
      { name: "Executive Suite", description: "Separate lounge and a terrace toward the lake.", price: 36000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 14, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Garden View","Balcony"] },
    ],
  },
  {
    name: "Lake Naivasha Sopa Resort", city: "Naivasha", location: "Moi South Lake Road, Naivasha, Nakuru County", starRating: 4,
    description: "Cottages spread across wide lakeside grounds where waterbuck and zebra graze freely between the blocks. A short boat ride from Crescent Island.",
    phone: null, email: null, checkInTime: "12:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Parking","24h Front Desk","Conference Rooms","Lake Access","Game Viewing","Family Friendly"],
    rooms: [
      { name: "Standard Cottage", description: "Twin or double cottage among the lakeside lawns.", price: 13500, currency: "KES", bedType: "Double", maxGuests: 3, quantity: 80, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker","Garden View","Balcony"] },
      { name: "Family Cottage", description: "Two connected rooms sharing a verandah.", price: 22000, currency: "KES", bedType: "Double", maxGuests: 5, quantity: 20, imageUrl: ROOM_IMG.deluxe, amenities: ["Flat-screen TV","Safe","Coffee Maker","Garden View","Sofa Bed"] },
    ],
  },

  // ── Central: Nanyuki ───────────────────────────────────────────────────────
  {
    name: "Fairmont Mount Kenya Safari Club", city: "Nanyuki", location: "Mount Kenya, Nanyuki, Laikipia", starRating: 5,
    description: "Founded by William Holden on the equator at the foot of Mount Kenya, with manicured lawns framing the peak, an animal orphanage and a nine-hole course. A Kenyan institution.",
    phone: null, email: null, checkInTime: "15:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.lobby, HOTEL_IMG.suite],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Spa","Parking","24h Front Desk","Golf Course","Horse Riding","Game Viewing","Concierge","Room Service"],
    rooms: [
      { name: "Superior Room", description: "Fireplace, garden aspect, mountain beyond.", price: 28000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 40, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker","Fireplace","Garden View","Mountain View"] },
      { name: "Garden Suite", description: "Two rooms and a private lawn facing the peak.", price: 58000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 10, imageUrl: ROOM_IMG.suite, amenities: ["Flat-screen TV","Mini Bar","Safe","Bathtub","Fireplace","Mountain View","Balcony"] },
    ],
  },
  {
    name: "Sportsman's Arms Hotel", city: "Nanyuki", location: "Nanyuki Town, Laikipia", starRating: 3,
    description: "The practical Nanyuki base — a long-running town hotel used by climbers heading for Mount Kenya and by anyone staging a Laikipia safari.",
    phone: null, email: null, checkInTime: "12:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Parking","24h Front Desk","Conference Rooms","Laundry","Family Friendly"],
    rooms: [
      { name: "Standard Room", description: "Simple, warm and clean — the essentials before a climb.", price: 6500, currency: "KES", bedType: "Double", maxGuests: 2, quantity: 50, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker"] },
      { name: "Cottage", description: "Self-contained cottage with a sitting room and fireplace.", price: 12000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 15, imageUrl: ROOM_IMG.deluxe, amenities: ["Flat-screen TV","Safe","Fireplace","Sofa Bed","Garden View"] },
    ],
  },

  // ── Rift Valley: Nakuru ────────────────────────────────────────────────────
  {
    name: "Sarova Lion Hill Game Lodge", city: "Nakuru", location: "Lake Nakuru National Park, Nakuru", starRating: 4,
    description: "Inside the park on a ridge above Lake Nakuru, with flamingo flats below and rhino on the game drives. The only full-service lodge within the gates.",
    phone: null, email: null, checkInTime: "12:00", checkOutTime: "10:00",
    website: "https://www.sarovahotels.com/lionhill-nakuru/",
    imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.classic],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Spa","Parking","24h Front Desk","Game Viewing","Conference Rooms","Family Friendly"],
    rooms: [
      { name: "Standard Chalet", description: "Hillside chalet looking over the lake and the park.", price: 17000, currency: "KES", bedType: "Double", maxGuests: 3, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker","Balcony","Lake View"] },
      { name: "Executive Chalet", description: "Larger chalet with a sitting area and wide verandah.", price: 26000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 20, imageUrl: ROOM_IMG.deluxe, amenities: ["Flat-screen TV","Mini Bar","Safe","Bathtub","Balcony","Lake View"] },
    ],
  },
  {
    name: "Merica Hotel Nakuru", city: "Nakuru", location: "Kenyatta Avenue, Nakuru Town", starRating: 4,
    description: "Nakuru town's main business address, on Kenyatta Avenue — conference floors, a rooftop pool and a short drive to the park gate.",
    phone: null, email: null, checkInTime: "12:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Parking","24h Front Desk","Conference Rooms","Business Center","Room Service"],
    rooms: [
      { name: "Standard Room", description: "Town-facing room with a proper desk.", price: 7500, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 60, imageUrl: ROOM_IMG.standard, amenities: ["Flat-screen TV","Safe","Coffee Maker","Work Desk","City View"] },
      { name: "Executive Room", description: "Upper floor, larger bathroom, lounge access.", price: 12500, currency: "KES", bedType: "King", maxGuests: 2, quantity: 25, imageUrl: ROOM_IMG.deluxe, amenities: ["Flat-screen TV","Mini Bar","Safe","Bathtub","City View","Lounge Access"] },
    ],
  },

  // ── Nyanza: Kisumu ─────────────────────────────────────────────────────────
  {
    name: "Acacia Premier Hotel", city: "Kisumu", location: "Achieng Oneko Road, Kisumu", starRating: 5,
    description: "Kisumu's tallest hotel, with a rooftop pool looking over the town toward Lake Victoria, and the city's most-used conference floors.",
    phone: null, email: null, checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: HOTEL_IMG.modern, images: [HOTEL_IMG.modern, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Conference Rooms","Business Center","Room Service","Airport Shuttle"],
    rooms: [
      { name: "Deluxe Room", description: "Bright room with lake or town views.", price: 12000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 70, imageUrl: ROOM_IMG.standard, amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk","Lake View"] },
      { name: "Executive Suite", description: "Separate lounge on an upper floor, wide lake outlook.", price: 24000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 12, imageUrl: ROOM_IMG.suite, amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Lake View","Lounge Access"] },
    ],
  },
  {
    name: "Kiboko Bay Resort", city: "Kisumu", location: "Dunga Beach, Kisumu", starRating: 3,
    description: "Luxury tented rooms on the Lake Victoria shore at Dunga, where hippo surface off the terrace at dusk and the fish comes in the same morning it is served.",
    phone: null, email: null, checkInTime: "12:00", checkOutTime: "10:00",
    imageUrl: HOTEL_IMG.classic, images: [HOTEL_IMG.classic, HOTEL_IMG.pool],
    amenities: ["WiFi","Swimming Pool","Restaurant","Bar","Parking","Lake Access","Boat Trips","Family Friendly"],
    rooms: [
      { name: "Luxury Tent", description: "Canvas walls, solid floor and en-suite, facing the water.", price: 9500, currency: "KES", bedType: "Double", maxGuests: 2, quantity: 20, imageUrl: ROOM_IMG.standard, amenities: ["Safe","Coffee Maker","Lake View","Balcony"] },
      { name: "Family Tent", description: "Two-bedroom tent sharing a lakeside deck.", price: 16000, currency: "KES", bedType: "Double", maxGuests: 4, quantity: 8, imageUrl: ROOM_IMG.deluxe, amenities: ["Safe","Coffee Maker","Lake View","Balcony","Sofa Bed"] },
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
    priceRange: 4, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80"],
    amenities: ["Outdoor Seating","Private Dining","Bar","Parking","Reservations Required","Vegan Options"],
    openingHours: defaultHours("12:00", "22:00", "11:00", "22:30"),
  },
  {
    name: "Kiza Lounge & Restaurant", city: "Nairobi", location: "Galana Plaza, Galana Road, Kilimani, Nairobi", cuisine: "Pan-African",
    description: "Kiza is Nairobi's most vibrant dining and nightlife destination. The kitchen serves bold, contemporary pan-African cuisine while the lounge transforms into the city's most exciting live music venue after dark.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"],
    amenities: ["Live Music","Bar","Rooftop","Outdoor Seating","Vegan Options","Reservations Required"],
    openingHours: { ...defaultHours("18:00", "02:00", "18:00", "03:00"), monday: { open: "18:00", close: "02:00", closed: false }, tuesday: { open: "18:00", close: "02:00", closed: false } },
  },
  {
    name: "Carnivore Restaurant", city: "Nairobi", location: "Langata Road, Nairobi", cuisine: "Nyama Choma / African Grill",
    description: "Nairobi's most famous restaurant since 1980. An all-you-can-eat carnival of roasted meats carved tableside from a giant Maasai sword, around a legendary charcoal pit.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Outdoor Seating","Live Music","Bar","Parking","Reservations Required","Private Dining"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "About Thyme", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "International",
    description: "A long-standing Westlands favourite for relaxed, well-executed international dishes in a leafy garden setting — a go-to for weekday lunches and long weekend brunches.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Vegetarian Options","Parking","Reservations Required"],
    openingHours: defaultHours("08:00", "22:00", "08:00", "22:30"),
  },
  {
    name: "Cultiva Farm to Table", city: "Nairobi", location: "Karen, Nairobi", cuisine: "Farm-to-Table",
    description: "A garden restaurant built around its own working farm — herbs, vegetables, and eggs harvested steps from the kitchen, with a menu that changes with the season.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["Outdoor Seating","Vegan Options","Vegetarian Options","Kid Friendly","Parking","Farm Tours"],
    openingHours: defaultHours("08:00", "21:00", "08:00", "21:30"),
  },
  {
    name: "Seven Seafood & Grill", city: "Nairobi", location: "The Alchemist, Westlands, Nairobi", cuisine: "Seafood & Grill",
    description: "A stylish rooftop seafood and grill house above The Alchemist, known for fresh coastal catches flown in daily and a lively cocktail scene into the night.",
    priceRange: 4, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80"],
    amenities: ["Rooftop","Live Music","Bar","Outdoor Seating","Reservations Required","Valet Parking"],
    openingHours: { ...defaultHours("17:00", "23:30", "12:00", "01:00"), sunday: { open: "12:00", close: "22:00", closed: false } },
  },
  {
    name: "Mediterraneo Restaurant", city: "Nairobi", location: "Lenana Road, Kilimani, Nairobi", cuisine: "Italian",
    description: "A neighbourhood Italian trattoria loved for its wood-fired pizzas, homemade pasta, and unpretentious garden courtyard — a Kilimani classic for decades.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"],
    amenities: ["Outdoor Seating","Vegetarian Options","Parking","Kid Friendly","Takeaway"],
    openingHours: defaultHours("11:30", "22:00", "11:30", "22:30"),
  },
  {
    name: "Nyama Mama", city: "Nairobi", location: "The Prism, Westlands, Nairobi", cuisine: "Modern Kenyan",
    description: "A vibrant modern take on Kenyan comfort food — think elevated nyama choma, matumbo, and mursik, served in a colourful, Instagram-ready space.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Vegetarian Options","Delivery","Kid Friendly"],
    openingHours: defaultHours("07:30", "22:00", "07:30", "22:30"),
  },
  {
    name: "Onami Restaurant", city: "Nairobi", location: "General Mathenge Drive, Westlands, Nairobi", cuisine: "Japanese",
    description: "Nairobi's most established Japanese restaurant — sushi, teppanyaki, and robata grill in a serene, minimalist dining room.",
    priceRange: 4, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Private Dining","Bar","Parking","Reservations Required","Vegetarian Options"],
    openingHours: { ...defaultHours("12:00", "22:30", "12:00", "23:00"), monday: { open: "18:00", close: "22:30", closed: false } },
  },
  {
    name: "K'Osewe Ranalo Foods", city: "Nairobi", location: "Koinange Street, CBD, Nairobi", cuisine: "Kenyan / Luo",
    description: "The city's best-loved home for authentic Luo cuisine — fresh tilapia, omena, and traditional greens served exactly as they would be in Nyanza.",
    priceRange: 1, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80","https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"],
    amenities: ["Takeaway","WiFi","Halal Options","Vegetarian Options"],
    openingHours: defaultHours("07:00", "21:00", "07:00", "21:00"),
  },
  {
    name: "Java House", city: "Nairobi", location: "Junction Mall, Ngong Road, Nairobi", cuisine: "Café / American",
    description: "Kenya's original coffee house chain — the go-to for a proper cappuccino, all-day breakfast, and reliable comfort food across the city.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["WiFi","Outdoor Seating","Takeaway","Delivery","Kid Friendly","Vegetarian Options"],
    openingHours: defaultHours("06:30", "22:00", "06:30", "22:30"),
  },
  {
    name: "Artcaffe", city: "Nairobi", location: "The Oval, Westlands, Nairobi", cuisine: "Café / Bakery",
    description: "A stylish bakery-café known for its fresh pastries, all-day brunch menu, and consistently excellent coffee — a Nairobi mainstay for over a decade.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["WiFi","Outdoor Seating","Takeaway","Delivery","Vegetarian Options","Vegan Options"],
    openingHours: defaultHours("06:30", "21:30", "06:30", "22:00"),
  },
  {
    name: "Mama Rocks Burgers", city: "Nairobi", location: "Delta Corner, Westlands, Nairobi", cuisine: "American / Burgers",
    description: "Nairobi's original gourmet burger joint — thick, juicy, made-to-order patties with a build-your-own topping bar and hand-cut fries.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Outdoor Seating","Takeaway","Delivery","Kid Friendly","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
  },
  {
    name: "Habesha Restaurant", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "Ethiopian",
    description: "An authentic Ethiopian dining experience — communal platters of injera and richly spiced stews, served in a warm, traditionally decorated space with live cultural music on weekends.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"],
    amenities: ["Live Music","Vegan Options","Vegetarian Options","Outdoor Seating","Private Dining"],
    openingHours: defaultHours("11:00", "22:30", "11:00", "23:00"),
  },
  {
    name: "Osteria del Chianti", city: "Nairobi", location: "General Mathenge Drive, Westlands, Nairobi", cuisine: "Italian",
    description: "A refined, intimate Italian osteria specialising in handmade pasta and an extensive Tuscan wine list, run by an Italian-trained kitchen team.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],
    amenities: ["Reservations Required","Bar","Outdoor Seating","Vegetarian Options","Private Dining"],
    openingHours: { ...defaultHours("12:00", "22:00", "12:00", "22:30"), monday: { open: "12:00", close: "22:00", closed: true } },
  },
  {
    name: "Le Grenier à Pain", city: "Nairobi", location: "Riverside Drive, Nairobi", cuisine: "French Bakery & Bistro",
    description: "A true French bakery and bistro — flaky croissants, real baguettes, and classic bistro plates, run with unmistakable Parisian precision.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80","https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80"],
    amenities: ["Outdoor Seating","WiFi","Takeaway","Vegetarian Options","Parking"],
    openingHours: defaultHours("06:30", "21:00", "07:00", "21:00"),
  },
  {
    name: "Charcoal Grill Woodvale", city: "Nairobi", location: "Woodvale Grove, Westlands, Nairobi", cuisine: "Grill / Nyama Choma",
    description: "A no-frills, always-packed Westlands grill house famous for its charcoal-roasted meats and lively weekend crowd — a favourite for casual nights out.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
    amenities: ["Outdoor Seating","Live Music","Bar","Parking","Takeaway"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "01:00"),
  },
  {
    name: "Fogo Gaucho Brazilian Steakhouse", city: "Nairobi", location: "Rosslyn Riviera, Nairobi", cuisine: "Brazilian Steakhouse",
    description: "Nairobi's take on the Brazilian churrascaria — endless tableside-carved cuts of beef, lamb, and chicken, paired with a full salad and hot bar.",
    priceRange: 4, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1424847651672-bf20a4b0982b?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["Private Dining","Bar","Parking","Reservations Required","Outdoor Seating"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "Symphony Restaurant & Lounge", city: "Nairobi", location: "Yaya Centre, Kilimani, Nairobi", cuisine: "International Fusion",
    description: "A sleek, upscale lounge above Yaya Centre with a broad international menu, sushi bar, and a rooftop terrace that turns into one of Kilimani's liveliest evening spots.",
    priceRange: 3, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80","https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80"],
    amenities: ["Rooftop","Live Music","Bar","Outdoor Seating","Vegetarian Options","Reservations Required"],
    openingHours: { ...defaultHours("12:00", "23:00", "12:00", "01:00"), sunday: { open: "12:00", close: "22:00", closed: false } },
  },
  {
    name: "Ocean Basket", city: "Nairobi", location: "The Junction Mall, Ngong Road, Nairobi", cuisine: "Seafood",
    description: "The Nairobi outpost of the popular pan-African seafood chain — fresh calamari, prawns, and fish served in a casual, family-friendly setting.",
    priceRange: 2, phone: null, email: null,
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80"],
    amenities: ["Kid Friendly","Takeaway","Delivery","WiFi","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
  },

  // ── Nairobi expansion: current openings ────────────────────────────────────
  // Same caveat as the hotels above — names, neighbourhoods and cuisines are
  // accurate, prices and reviews are illustrative.
  {
    name: "INTI", city: "Nairobi", location: "One Africa Place, Waiyaki Way, Westlands, Nairobi", cuisine: "Japanese-Peruvian",
    description: "Nikkei cooking twenty floors above Westlands — the Japanese-Peruvian tradition of ceviche, tiradito and robata, plated with the most ambitious kitchen technique in the city and a skyline to match.",
    priceRange: 4, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.bar, DINING_IMG.casual],
    amenities: ["Rooftop","Bar","Reservations Required","Private Dining","Valet Parking","Vegetarian Options"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "00:00"),
  },
  {
    name: "Ankole Grill", city: "Nairobi", location: "Kitisuru, Nairobi", cuisine: "African Steakhouse",
    description: "Named for the long-horned cattle breed of the Great Lakes, Ankole makes the case for an East African steakhouse — dry-aged local beef over open flame, in a garden setting in Kitisuru.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.grill, images: [DINING_IMG.grill, DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Live Music","Private Dining","Family Friendly"],
    openingHours: defaultHours("12:00", "22:30", "11:00", "23:00"),
  },
  {
    name: "Shamba Café", city: "Nairobi", location: "Karen, Nairobi", cuisine: "Health & Brunch",
    description: "An all-day Karen café built around locally sourced produce — grain bowls, cold-press juices and a shop selling the same farm goods the kitchen cooks with.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Takeaway","Parking","Vegan Options","Vegetarian Options","Gluten-Free Options","Family Friendly"],
    openingHours: defaultHours("07:30", "18:00", "08:00", "18:00"),
  },

  // ── Cuisine specialists ────────────────────────────────────────────────────
  {
    name: "Haandi", city: "Nairobi", location: "The Mall, Westlands, Nairobi", cuisine: "North Indian",
    description: "North-West Frontier cooking that has held its Westlands following for decades — tandoor breads, slow-cooked dals and karahi dishes finished at the pass.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Parking","Takeaway","Private Dining","Vegetarian Options","Vegan Options","Halal"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "Misono", city: "Nairobi", location: "Lavington, Nairobi", cuisine: "Japanese",
    description: "A quiet Lavington Japanese room doing teppanyaki tables, a small sushi counter and a proper ramen bowl — the city's most complete Japanese offering.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Parking","Private Dining","Reservations Required","Vegetarian Options","Takeaway"],
    openingHours: defaultHours("12:00", "22:00", "12:00", "22:30"),
  },

  // ── Hotel signature restaurants ────────────────────────────────────────────
  {
    name: "Sarabi Rooftop — Sankara Nairobi", city: "Nairobi", location: "Sankara Nairobi, Woodvale Grove, Westlands, Nairobi", cuisine: "Pan-African",
    description: "Sankara's rooftop pool deck and grill, and the Westlands address for closing a deal over nyama choma with a view. Sunset service is the one to book.",
    priceRange: 4, phone: null, email: null,
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.grill, DINING_IMG.fine],
    amenities: ["Rooftop","Bar","Outdoor Seating","Live Music","Valet Parking","Reservations Required","Pool Access"],
    openingHours: defaultHours("11:00", "23:00", "11:00", "00:00"),
  },
  {
    name: "Jiko — Tribe Hotel", city: "Nairobi", location: "Tribe Hotel, Limuru Road, Gigiri, Nairobi", cuisine: "Contemporary African",
    description: "Tribe's signature dining room, built as a tribute to Kenyan growers — organic produce, a playful hand with presentation, and one of the more thoughtful African menus in the city.",
    priceRange: 4, phone: null, email: null,
    website: "https://www.tribe-hotel.com/nairobi/jiko-restaurant-nairobi/",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Bar","Outdoor Seating","Private Dining","Valet Parking","Reservations Required","Vegetarian Options","Vegan Options"],
    openingHours: defaultHours("06:30", "22:30", "07:00", "23:00"),
  },
  {
    name: "Lucca — Villa Rosa Kempinski", city: "Nairobi", location: "Villa Rosa Kempinski, Chiromo Road, Westlands, Nairobi", cuisine: "Italian",
    description: "Kempinski's Italian dining room, and the most formal of the hotel's eight venues — house-made pasta, a serious cellar, and service pitched at the old-school end.",
    priceRange: 4, phone: null, email: null,
    website: "https://www.kempinski.com/en/hotel-villa-rosa/restaurants-bars",
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.bar],
    amenities: ["Bar","Private Dining","Valet Parking","Reservations Required","Wine List","Vegetarian Options"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "Harvest — Trademark Hotel", city: "Nairobi", location: "Trademark Hotel, Church Road, Museum Hill, Nairobi", cuisine: "International",
    description: "Trademark's all-day dining room off the atrium — a strong breakfast buffet, a working lunch menu, and a poolside terrace that gets the afternoon sun.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Bar","Valet Parking","Buffet","Family Friendly","Vegetarian Options"],
    openingHours: defaultHours("06:30", "22:30", "07:00", "23:00"),
  },
  {
    name: "Osteria Romana Terrazo — Sankara Nairobi", city: "Nairobi", location: "Sankara Nairobi, Woodvale Grove, Westlands, Nairobi", cuisine: "Italian",
    description: "The terrace-level Italian at Sankara — Roman classics served from lunch through dinner, spilling onto a covered terrace over Woodvale Grove.",
    priceRange: 3, phone: null, email: null,
    website: "https://sankara.com/dining/osteria-romana-terrazo/",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Valet Parking","Reservations Required","Vegetarian Options","Wine List"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },

  // ── Hotel dining ───────────────────────────────────────────────────────────
  {
    name: "Nyama Choma Ranch — Safari Park Hotel", city: "Nairobi", location: "Safari Park Hotel, Thika Road, Kasarani, Nairobi", cuisine: "Grill / Nyama Choma",
    description: "The open-sided grill at the heart of Safari Park's gardens, and one of the city's benchmark nyama choma addresses — meat carved to the table, served alongside the Safari Cats dinner show.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.grill, images: [DINING_IMG.grill, DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Live Music","Family Friendly","Group Dining","Buffet"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "23:30"),
  },

  // ── Mall dining ────────────────────────────────────────────────────────────
  {
    name: "Hero Restaurant", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "International",
    description: "The comic-themed dining room at Village Market, built around four house characters. Broad international menu, a long wine list, and a room that works equally for a family lunch or an after-work bottle.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.bar],
    amenities: ["Bar","Outdoor Seating","Parking","Family Friendly","Wine List","Takeaway","Vegetarian Options"],
    openingHours: defaultHours("11:00", "22:30", "10:00", "23:00"),
  },
  {
    name: "Golden Stool", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "West African",
    description: "West African cooking at Village Market — jollof, egusi, suya and grilled shrimp, in a room dressed with Ashanti motifs. The most complete Ghanaian and Nigerian menu in Nairobi.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Bar","Parking","Takeaway","Private Dining","Family Friendly","Halal"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
  },
  {
    name: "Sierra Lounge Yaya", city: "Nairobi", location: "Yaya Centre, Argwings Kodhek Road, Kilimani, Nairobi", cuisine: "Grill / Brewery",
    description: "House-brewed lager and ale alongside a wood-fired grill, on the top level of Yaya Centre. The reliable Kilimani choice for a long lunch that becomes an evening.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.grill, DINING_IMG.casual],
    amenities: ["Bar","Outdoor Seating","Parking","Live Music","Sports Screens","Takeaway","Brewery"],
    openingHours: defaultHours("11:00", "23:00", "11:00", "00:00"),
  },
  {
    name: "Café Deli The Hub", city: "Nairobi", location: "The Hub Karen, Dagoretti Road, Karen, Nairobi", cuisine: "Café / Kenyan",
    description: "The Karen branch of the homegrown all-day café — Kenyan breakfasts, a strong pastry counter and a menu that runs from ugali to pasta without apology.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Outdoor Seating","Parking","Takeaway","Family Friendly","Vegetarian Options","Breakfast"],
    openingHours: defaultHours("07:00", "22:00", "07:30", "22:00"),
  },
  {
    name: "Chowpaty", city: "Nairobi", location: "Diamond Plaza, Masari Road, Parklands, Nairobi", cuisine: "Indian Vegetarian",
    description: "Parklands' long-standing pure-vegetarian Indian kitchen — Mumbai street chaat, South Indian dosas and Gujarati thalis, at Diamond Plaza.",
    priceRange: 1, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Takeaway","Parking","Family Friendly","Vegetarian Options","Vegan Options","Group Dining"],
    openingHours: defaultHours("11:00", "22:00", "11:00", "22:30"),
  },

  // ── Nightlife ──────────────────────────────────────────────────────────────
  // No dedicated venue type in the schema yet, so lounges and clubs sit under
  // restaurants with a Club & Lounge cuisine so they group in the filter.
  {
    name: "B-Club Nairobi", city: "Nairobi", location: "Galana Plaza, Galana Road, Kilimani, Nairobi", cuisine: "Club & Lounge",
    description: "Nairobi's highest-end nightclub — bottle service, a strict door and a room that fills with the city's celebrity crowd well after midnight. Table reservations are effectively required at weekends.",
    priceRange: 4, phone: null, email: null,
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual],
    amenities: ["Bar","VIP Tables","Bottle Service","Valet Parking","Live DJ","Reservations Required","Dress Code","Late Night"],
    openingHours: defaultHours("21:00", "04:00", "21:00", "05:00"),
  },
  {
    name: "Mercury Lounge Village Market", city: "Nairobi", location: "Village Market, Limuru Road, Gigiri, Nairobi", cuisine: "Club & Lounge",
    description: "Cocktail bar, restaurant and weekend DJ room in one — and the most reliable place in Nairobi to catch a live rhythm section on a weeknight rather than a playlist.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual, DINING_IMG.fine],
    amenities: ["Bar","Outdoor Seating","Live Music","Parking","Late Night","Reservations Required","Vegetarian Options"],
    openingHours: defaultHours("12:00", "01:00", "12:00", "02:00"),
  },
  {
    name: "The Alchemist Bar", city: "Nairobi", location: "Parklands Road, Westlands, Nairobi", cuisine: "Club & Lounge",
    description: "The open-air Westlands courtyard that reset Nairobi nightlife — food trucks around a container bar, a proper stage, and a rotation of live bands, DJ sets, comedy and fashion nights.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.bar, images: [DINING_IMG.bar, DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Bar","Outdoor Seating","Live Music","Live DJ","Food Trucks","Parking","Late Night","Family Friendly"],
    openingHours: defaultHours("12:00", "23:00", "12:00", "03:00"),
  },

  // ── Beyond Nairobi ─────────────────────────────────────────────────────────
  {
    name: "Tamarind Mombasa", city: "Mombasa", location: "Silo Road, Nyali, Mombasa", cuisine: "Seafood",
    description: "The white Moorish landmark above Tudor Creek, and the coast's best-known seafood room for four decades. The dhow dinner cruise leaves from the jetty below.",
    priceRange: 4, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Reservations Required","Private Dining","Sea View","Wine List"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "Ali Barbour's Cave Restaurant", city: "Diani", location: "Diani Beach Road, Diani, Kwale", cuisine: "Seafood",
    description: "Dinner served in a coral cave several hundred thousand years old, open to the stars through gaps in the roof. Candlelit, seafood-led, and unlike anywhere else in Kenya.",
    priceRange: 4, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Reservations Required","Bar","Parking","Private Dining","Romantic","Wine List"],
    openingHours: defaultHours("18:30", "23:00", "18:30", "23:30"),
  },
  {
    name: "The Old Man and the Sea", city: "Malindi", location: "Vasco Da Gama Road, Malindi, Kilifi", cuisine: "Italian Seafood",
    description: "Malindi's Italian-Swahili seafood room in an old Portuguese-era building near the jetty — pasta with the morning's catch, and a wine list unusual for a coastal town.",
    priceRange: 3, phone: null, email: null,
    imageUrl: DINING_IMG.fine, images: [DINING_IMG.fine, DINING_IMG.casual],
    amenities: ["Outdoor Seating","Bar","Reservations Required","Wine List","Sea View"],
    openingHours: defaultHours("12:00", "22:30", "12:00", "23:00"),
  },
  {
    name: "Ranch House Bistro", city: "Naivasha", location: "Moi South Lake Road, Naivasha, Nakuru County", cuisine: "Farm-to-Table",
    description: "A working-farm bistro on South Lake Road serving what the surrounding smallholdings produce — the standard stop between Nairobi and the Mara.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Garden","Parking","Family Friendly","Vegetarian Options","Takeaway"],
    openingHours: defaultHours("08:00", "20:00", "08:00", "21:00"),
  },
  {
    name: "Trout Tree Restaurant", city: "Nanyuki", location: "Nanyuki–Naro Moru Road, Nanyuki, Laikipia", cuisine: "Trout / Farm-to-Table",
    description: "Tables built into the branches of a giant mugumo fig above a working trout farm, with colobus monkeys in the canopy. You choose the fish from the ponds below.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Parking","Family Friendly","Vegetarian Options","Takeaway","Garden"],
    openingHours: defaultHours("10:00", "18:00", "10:00", "18:00"),
  },
  {
    name: "Kiboko Bay Lakeside Restaurant", city: "Kisumu", location: "Dunga Beach, Kisumu", cuisine: "Lake Fish",
    description: "An open deck on the Lake Victoria shore where the tilapia comes out of the water the same morning. Hippo surface off the terrace at dusk.",
    priceRange: 2, phone: null, email: null,
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Bar","Parking","Family Friendly","Lake View","Boat Trips"],
    openingHours: defaultHours("08:00", "22:00", "08:00", "22:30"),
  },
  {
    name: "Courtyard Restaurant Nakuru", city: "Nakuru", location: "Kenyatta Avenue, Nakuru Town", cuisine: "Grill / Nyama Choma",
    description: "Nakuru town's reliable grill — charcoal nyama choma in a walled courtyard, busy from lunch through the evening.",
    priceRange: 1, phone: null, email: null,
    imageUrl: DINING_IMG.grill, images: [DINING_IMG.grill, DINING_IMG.casual],
    amenities: ["Outdoor Seating","Bar","Parking","Takeaway","Family Friendly","Group Dining","Halal"],
    openingHours: defaultHours("10:00", "22:30", "10:00", "23:00"),
  },
];

// ─── Clubs & leisure ─────────────────────────────────────────────────────────
// Green fees are indicative weekday visitor rates and do move — they orient a
// reader rather than quote them. Access tiers follow what each club publishes;
// where a club closes particular days to visitors that sits in visitorNotes
// rather than being flattened into the tier.

const CLUBS = [
  {
    name: "Muthaiga Golf Club", city: "Nairobi", location: "Muthaiga Road, Muthaiga, Nairobi",
    category: "GOLF" as const, access: "BY_ARRANGEMENT" as const,
    description: "Kenya's best-known championship course and long-time host of the Kenya Open, laid out among the mature trees of Muthaiga. Visitors can play, but the tee sheet belongs to members first.",
    holes: 18, par: 71, visitorFee: 6000, currency: "KES",
    visitorNotes: "Call ahead. Wednesday and Saturday are competition days and generally closed to visitors.",
    phone: null, email: null, website: "https://www.muthaigagolfclub.com",
    amenities: ["Championship Course","Clubhouse","Pro Shop","Driving Range","Caddies","Restaurant","Bar","Tennis","Swimming Pool","Parking"],
  },
  {
    name: "Karen Country Club", city: "Nairobi", location: "Karen Road, Karen, Nairobi",
    category: "COUNTRY" as const, access: "BY_ARRANGEMENT" as const,
    description: "A parkland course on part of Karen Blixen's original estate, with the Ngong Hills on the skyline. As much a country club as a golf club — tennis, squash and a busy social calendar alongside the course.",
    holes: 18, par: 72, visitorFee: 7000, currency: "KES",
    visitorNotes: "Visitors play by prior arrangement, usually introduced by a member.",
    phone: null, email: null, website: null,
    amenities: ["Championship Course","Clubhouse","Pro Shop","Driving Range","Caddies","Tennis","Squash","Swimming Pool","Restaurant","Bar","Parking"],
  },
  {
    name: "Royal Nairobi Golf Club", city: "Nairobi", location: "Ngong Road, Nairobi",
    category: "GOLF" as const, access: "BY_ARRANGEMENT" as const,
    description: "Founded in 1906 and the oldest golf club in East Africa, a short drive from the city centre on Ngong Road. Compact, tree-lined and more central than its rivals.",
    holes: 18, par: 71, visitorFee: 5000, currency: "KES",
    visitorNotes: "Weekday visitor tee times are the easiest to get.",
    phone: null, email: null, website: null,
    amenities: ["Clubhouse","Pro Shop","Driving Range","Caddies","Restaurant","Bar","Parking"],
  },
  {
    name: "Windsor Golf Hotel & Country Club", city: "Nairobi", location: "Kigwa Road, Ridgeways, Nairobi",
    category: "COUNTRY" as const, access: "VISITORS_WELCOME" as const,
    description: "The one Nairobi club built around a hotel, so a visitor can book a room and a tee time in the same call. An undulating course through indigenous forest on the northern edge of the city.",
    holes: 18, par: 72, visitorFee: 8000, currency: "KES",
    visitorNotes: "Open to visiting golfers and hotel guests without an introduction.",
    phone: null, email: null, website: null,
    amenities: ["Championship Course","Hotel","Clubhouse","Pro Shop","Driving Range","Caddies","Spa","Swimming Pool","Tennis","Restaurant","Bar","Conference Rooms","Parking"],
  },
  {
    name: "Sigona Golf Club", city: "Nairobi", location: "Kikuyu, Kiambu — off the Nairobi–Nakuru highway",
    category: "GOLF" as const, access: "BY_ARRANGEMENT" as const,
    description: "A hilly, well-regarded course outside the city at Kikuyu, rated by many Kenyan golfers alongside Muthaiga for the quality of the layout if not for convenience.",
    holes: 18, par: 71, visitorFee: 7500, currency: "KES",
    visitorNotes: "Weekday green fee around 7,500; weekends nearer 10,000. Book ahead.",
    phone: null, email: null, website: null,
    amenities: ["Championship Course","Clubhouse","Pro Shop","Driving Range","Caddies","Restaurant","Bar","Parking"],
  },
  {
    name: "Limuru Country Club", city: "Nairobi", location: "Limuru, Kiambu",
    category: "COUNTRY" as const, access: "BY_ARRANGEMENT" as const,
    description: "High above Nairobi in the tea country at Limuru, cool enough to want a sweater and quiet enough to hear the birds. A different game from the city courses.",
    holes: 18, par: 71, visitorFee: 6000, currency: "KES",
    visitorNotes: "Visitors welcome by arrangement; the drive from Nairobi takes about an hour.",
    phone: null, email: null, website: null,
    amenities: ["Clubhouse","Pro Shop","Caddies","Tennis","Restaurant","Bar","Parking"],
  },
  {
    name: "Vet Lab Sports Club", city: "Nairobi", location: "Ngong Road, Kabete, Nairobi",
    category: "SPORTS" as const, access: "BY_ARRANGEMENT" as const,
    description: "A relaxed members' sports club off Ngong Road with a nine-hole course alongside cricket and hockey. Less formal than the championship clubs and correspondingly easier to get on.",
    holes: 9, par: 35, visitorFee: 3000, currency: "KES",
    visitorNotes: "Nine holes played twice for a full round. Cricket and hockey share the grounds.",
    phone: null, email: null, website: null,
    amenities: ["Clubhouse","Cricket","Hockey","Caddies","Restaurant","Bar","Parking"],
  },
  {
    name: "Nyali Golf & Country Club", city: "Mombasa", location: "Links Road, Nyali, Mombasa",
    category: "COUNTRY" as const, access: "VISITORS_WELCOME" as const,
    description: "The coast's championship course, a short drive from the Nyali beach hotels. Warm, flat, and played early before the heat builds.",
    holes: 18, par: 71, visitorFee: 5500, currency: "KES",
    visitorNotes: "Popular with hotel guests; the early morning tee times are the pleasant ones.",
    phone: null, email: null, website: null,
    amenities: ["Championship Course","Clubhouse","Pro Shop","Driving Range","Caddies","Swimming Pool","Restaurant","Bar","Parking"],
  },
  {
    name: "Great Rift Valley Golf Course", city: "Naivasha", location: "Great Rift Valley Lodge, Naivasha, Nakuru County",
    category: "GOLF" as const, access: "VISITORS_WELCOME" as const,
    description: "Cut into an escarpment above Lake Naivasha with the Rift floor spread out below — the most dramatic setting of any course in Kenya, and zebra on the fairways often enough to be unremarkable.",
    holes: 18, par: 72, visitorFee: 7000, currency: "KES",
    visitorNotes: "Open to lodge guests and visiting golfers. The altitude adds noticeable distance off the tee.",
    phone: null, email: null, website: null,
    amenities: ["Championship Course","Hotel","Clubhouse","Pro Shop","Caddies","Swimming Pool","Restaurant","Bar","Game Viewing","Parking"],
  },
  {
    name: "Nanyuki Sports Club", city: "Nanyuki", location: "Nanyuki Town, Laikipia",
    category: "SPORTS" as const, access: "VISITORS_WELCOME" as const,
    description: "A nine-hole course on the equator with Mount Kenya filling the skyline on a clear morning. Unfussy, welcoming, and the social centre of Nanyuki.",
    holes: 9, par: 35, visitorFee: 2500, currency: "KES",
    visitorNotes: "Visitors pay a green fee at the clubhouse. Mountain views are best before the cloud comes in.",
    phone: null, email: null, website: null,
    amenities: ["Clubhouse","Caddies","Tennis","Squash","Restaurant","Bar","Parking"],
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
      const hotel = await prisma.hotel.create({ data: { partnerId: hotelPartner.id, name: h.name, description: h.description, city: h.city, location: h.location, starRating: h.starRating, phone: h.phone, email: h.email, website: "website" in h ? h.website : null, checkInTime: h.checkInTime, checkOutTime: h.checkOutTime, imageUrl: h.imageUrl, images: h.images, amenities: h.amenities, published: true, verified: "website" in h && !!h.website } });
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
      const restaurant = await prisma.restaurant.create({ data: { partnerId: restaurantPartner.id, name: r.name, description: r.description, city: r.city, location: r.location, cuisine: r.cuisine, priceRange: r.priceRange, phone: r.phone, email: r.email, website: "website" in r ? r.website : null, imageUrl: r.imageUrl, images: r.images, amenities: r.amenities, openingHours: r.openingHours, published: true, verified: "website" in r && !!r.website } });
      // No seeded menu items — prices are the venue's to confirm, and guests
      // are sent to the venue's own site to book. Partners add their real menu
      // from the dashboard during onboarding.
      // No seeded reviews — see the note in the hotel loop above.
      restaurantsCreated++;
    }
  }

  console.log(`✅  ${eventsCreated} events seeded (${EVENTS.length - eventsCreated} already existed)`);
  console.log(`✅  ${hotelsCreated} hotels seeded   (${HOTELS.length - hotelsCreated} already existed)`);
  // ── Clubs ──────────────────────────────────────────────────────────────────
  let clubsCreated = 0;
  for (const c of CLUBS) {
    const existing = await prisma.club.findFirst({ where: { name: c.name } });
    if (!existing) {
      await prisma.club.create({
        data: {
          partnerId: hotelPartner.id,
          name: c.name, description: c.description, city: c.city, location: c.location,
          category: c.category, access: c.access,
          holes: c.holes, par: c.par, visitorFee: c.visitorFee, currency: c.currency,
          visitorNotes: c.visitorNotes,
          phone: c.phone, email: c.email, website: c.website,
          imageUrl: HOTEL_IMG.pool, images: [HOTEL_IMG.pool, HOTEL_IMG.classic],
          amenities: c.amenities, published: true, verified: !!c.website,
        },
      });
      clubsCreated++;
    }
  }
  console.log(`✅  ${restaurantsCreated} restaurants seeded (${RESTAURANTS.length - restaurantsCreated} already existed)`);
  console.log(`✅  ${clubsCreated} clubs seeded    (${CLUBS.length - clubsCreated} already existed)`);
  // Passwords are gone: these accounts sign in with an emailed code like any
  // other. The hashes are seeded only so the legacy /auth/login route still
  // works for anyone who used it before the change.
  console.log("\n📋 Demo accounts — sign in at /auth/join with a code");
  console.log("   admin@dontbeboring.example     → Admin");
  console.log("   events@dontbeboring.example    → Events Partner");
  console.log("   hotels@dontbeboring.example    → Hotels Partner");
  console.log("   dining@dontbeboring.example    → Dining Partner");
  console.log("   customer@dontbeboring.example  → Customer");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

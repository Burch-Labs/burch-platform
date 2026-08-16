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
  { title: "Lagos Tech Summit 2026", description: "Africa's largest tech conference. Theme: AI for Africa. Two days of keynotes, workshops, and networking.", category: EventCategory.TECH, city: "Lagos", location: "Eko Convention Centre, Victoria Island", price: 15000, capacity: 2000, daysFromNow: 21, durationHours: 9, tags: ["technology", "ai", "startup"], imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80" },
  { title: "Accra Food & Wine Festival", description: "West African cuisine, craft beers, and fine wines. 50+ restaurants, live highlife music.", category: EventCategory.FOOD_DRINK, city: "Accra", location: "Labadi Beach Hotel Grounds", price: 1800, capacity: 3000, daysFromNow: 7, durationHours: 7, tags: ["food", "wine", "culture"], imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80" },
  { title: "Cape Town Comedy Night", description: "The hottest stand-up comedians from across South Africa. Full bar, 18+.", category: EventCategory.COMEDY, city: "Cape Town", location: "The Baxter Theatre, Rondebosch", price: 350, capacity: 400, daysFromNow: 5, durationHours: 3, tags: ["comedy", "stand-up"], imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80" },
  { title: "Kampala Marathon 2026", description: "Uganda's biggest running event. Full, half, and fun run distances. All fitness levels welcome.", category: EventCategory.SPORTS, city: "Kampala", location: "Kololo Airstrip", price: 500, capacity: 8000, daysFromNow: 30, durationHours: 6, tags: ["marathon", "running"], imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80" },
  { title: "Johannesburg Art Week", description: "A week-long celebration of contemporary African art. Gallery openings, artist talks, live painting.", category: EventCategory.ARTS, city: "Johannesburg", location: "Maboneng Precinct, Arts on Main", price: 0, capacity: 1000, daysFromNow: 10, durationHours: 8, tags: ["art", "gallery", "free"], imageUrl: "https://images.unsplash.com/photo-1531913223931-b0d3198229ee?w=800&q=80" },
  { title: "Kigali Business Summit", description: "Rwanda's flagship business event connecting entrepreneurs, investors, and policy makers.", category: EventCategory.BUSINESS, city: "Kigali", location: "Kigali Convention Centre", price: 25000, capacity: 800, daysFromNow: 45, durationHours: 8, tags: ["business", "investment"], imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80" },
  { title: "Dar es Salaam Film Festival", description: "East Africa's premier film festival. Feature films, documentaries, and short films from 20+ countries.", category: EventCategory.FILM, city: "Dar es Salaam", location: "Diamond Jubilee Hall", price: 800, capacity: 600, daysFromNow: 18, durationHours: 5, tags: ["film", "cinema"], imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80" },
  { title: "Nairobi AfroBeats Night", description: "The hottest Afrobeats night featuring live performances and DJ sets at the iconic Carnivore.", category: EventCategory.MUSIC, city: "Nairobi", location: "Carnivore Restaurant, Langata", price: 1200, capacity: 1500, daysFromNow: 9, durationHours: 6, tags: ["afrobeats", "nightlife"], imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Cairo Design Week", description: "Egyptian and pan-African design talent — fashion, architecture, product design, and digital art.", category: EventCategory.ARTS, city: "Cairo", location: "GrEEK Campus, Downtown Cairo", price: 300, capacity: 2000, daysFromNow: 25, durationHours: 8, tags: ["design", "fashion"], imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80" },
  { title: "Nairobi Street Food Festival", description: "Fifty of Nairobi's best food trucks and pop-up kitchens in one place — nyama choma, mutura, mandazi, and modern fusion, all under one roof.", category: EventCategory.FOOD_DRINK, city: "Nairobi", location: "Uhuru Gardens, Langata Road", price: 500, capacity: 6000, daysFromNow: 12, durationHours: 9, tags: ["food", "street food", "family friendly"], imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80" },
  { title: "Nairobi Beats & Culture Festival", description: "A day-long celebration of Kenyan sound — Genge, Gengetone, Benga, and Afro-fusion acts across two stages, plus local fashion and art vendors.", category: EventCategory.MUSIC, city: "Nairobi", location: "Kasarani Indoor Arena", price: 2000, capacity: 10000, daysFromNow: 20, durationHours: 8, tags: ["music", "culture", "live"], imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80" },
  { title: "Nairobi Comedy Live", description: "Kenya's sharpest stand-up comedians for one night of nonstop laughs. Full bar, 18+.", category: EventCategory.COMEDY, city: "Nairobi", location: "Alliance Française, Loita Street", price: 800, capacity: 500, daysFromNow: 6, durationHours: 3, tags: ["comedy", "stand-up", "nightlife"], imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80" },
  { title: "Nairobi Startup & Innovation Summit", description: "East Africa's founders, investors, and policymakers under one roof — pitch competitions, panels on fintech and AgriTech, and investor speed-networking.", category: EventCategory.BUSINESS, city: "Nairobi", location: "KICC, City Square", price: 6000, capacity: 1500, daysFromNow: 35, durationHours: 8, tags: ["startup", "investment", "tech"], imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80" },
  { title: "Nairobi Half Marathon", description: "A scenic road race through the city's leafy suburbs finishing at Nyayo Stadium. Full, half, and 10K distances for every fitness level.", category: EventCategory.SPORTS, city: "Nairobi", location: "Nyayo National Stadium", price: 1500, capacity: 12000, daysFromNow: 40, durationHours: 5, tags: ["marathon", "running", "outdoor"], imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80" },
  { title: "Mombasa Beach Music Festival", description: "Sunset sets on the white sands of the coast — Afrobeats, dancehall, and Swahili taarab from Kenya's best coastal DJs and live bands.", category: EventCategory.MUSIC, city: "Mombasa", location: "Nyali Beach", price: 1800, capacity: 4000, daysFromNow: 28, durationHours: 7, tags: ["music", "beach", "festival"], imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80" },
  { title: "Kenya Coffee & Culture Expo", description: "Meet the growers behind Kenya's world-famous AA beans — cupping sessions, barista competitions, and farm-to-cup talks from Nyeri and Kiambu estates.", category: EventCategory.FOOD_DRINK, city: "Nairobi", location: "Sarit Expo Centre, Westlands", price: 700, capacity: 2500, daysFromNow: 16, durationHours: 6, tags: ["coffee", "expo", "culture"], imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80" },
];

// ─── Hotels ───────────────────────────────────────────────────────────────────

const HOTELS = [
  {
    // Operated by Fairmont, not Serena — the previous seed had it on a
    // serena.co.ke address, conflating two separate groups.
    name: "Fairmont The Norfolk", city: "Nairobi", location: "Harry Thuku Road, Nairobi", starRating: 5,
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
    reviews: [
      { rating: 5, title: "Absolutely magnificent", comment: "The Norfolk is simply stunning. The gardens are impeccably maintained and the staff go above and beyond." },
      { rating: 4, title: "Classic luxury", comment: "Beautiful historic property with great service. Room was large and comfortable." },
      { rating: 5, title: "Best hotel in Nairobi", comment: "Stayed for a work trip and was blown away. The pool area is gorgeous, food excellent." },
    ],
  },
  {
    name: "Eko Hotel & Suites", city: "Lagos", location: "Victoria Island, Lagos", starRating: 5,
    description: "Lagos' premier five-star destination overlooking the Atlantic Ocean. Multiple pools, world-class restaurants, and a full-service spa.",
    phone: "+234 1 277 9000", email: "reservations@ekohotels.com", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=800&q=80","https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","Airport Shuttle","24h Front Desk","Business Center","Conference Rooms","Room Service"],
    rooms: [
      { name: "Classic Room", description: "Contemporary room with city or ocean views.", price: 22000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 40, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk"] },
      { name: "Ocean View Suite", description: "Panoramic Atlantic views, separate lounge, premium amenities.", price: 48000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 12, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Ocean View","Balcony"] },
    ],
    reviews: [
      { rating: 5, title: "World-class in Lagos", comment: "Exceeded every expectation. Ocean view was breathtaking. The pool bar is a highlight." },
      { rating: 4, title: "Great business hotel", comment: "Excellent facilities. Meeting rooms are well-equipped, food quality is high." },
    ],
  },
  {
    name: "Labadi Beach Hotel", city: "Accra", location: "La Beach Road, Accra", starRating: 4,
    description: "Accra's iconic beachfront hotel. Traditional Ghanaian hospitality with international standards and direct beach access.",
    phone: "+233 30 277 2501", email: "info@labadibeachhotel.com", checkInTime: "14:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Beach Access","Restaurant","Bar","Gym","Parking","24h Front Desk","Room Service"],
    rooms: [
      { name: "Superior Beach Room", description: "Beach or pool views, vibrant Ghanaian style.", price: 14000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 30, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Ocean View"] },
      { name: "Beachfront Suite", description: "Private terrace steps from the beach, king bed and lounge area.", price: 26000, currency: "KES", bedType: "King", maxGuests: 3, quantity: 8, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Ocean View","Balcony"] },
    ],
    reviews: [
      { rating: 4, title: "Beach paradise in Accra", comment: "Unbeatable location. Pool area is beautiful." },
      { rating: 5, title: "Wonderful hospitality", comment: "Staff are exceptional. Beach access is fantastic." },
    ],
  },
  {
    name: "Kigali Serena Hotel", city: "Kigali", location: "KN 3 Ave, Kiyovu, Kigali", starRating: 5,
    description: "A landmark of elegance in Rwanda's capital, set in beautiful tropical gardens with stunning views of Kigali's famous hills.",
    phone: "+250 252 597 100", email: "kigali@serena.co.rw", checkInTime: "14:00", checkOutTime: "11:00",
    imageUrl: "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=800&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Restaurant","Bar","Spa","Parking","24h Front Desk","Business Center","Concierge"],
    rooms: [
      { name: "Garden Room", description: "Tropical garden views, modern amenities, African-inspired décor.", price: 16000, currency: "KES", bedType: "Queen", maxGuests: 2, quantity: 25, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Safe","Coffee Maker","Work Desk"] },
      { name: "Deluxe Hill View Room", description: "Panoramic views of the Kigali hills, upgraded furnishings.", price: 24000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 15, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","City View"] },
      { name: "Presidential Suite", description: "Three rooms, private dining, dedicated butler, panoramic city views.", price: 75000, currency: "KES", bedType: "King", maxGuests: 4, quantity: 2, imageUrl: "https://images.unsplash.com/photo-1631049552057-403cdb8f0658?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","City View","Balcony"] },
    ],
    reviews: [
      { rating: 5, title: "Serene and spectacular", comment: "The gardens are so peaceful. Food quality is top notch." },
      { rating: 5, title: "Best hotel in Kigali", comment: "Impeccable service, beautiful rooms, and the pool is lovely." },
    ],
  },
  {
    name: "The Westin Cape Town", city: "Cape Town", location: "Convention Square, Lower Long Street, Cape Town", starRating: 5,
    description: "Prime position in Convention Square with stunning Table Mountain views. Westin's Heavenly Bed and world-class wellness facilities.",
    phone: "+27 21 412 9999", email: "capetown.westin@westin.com", checkInTime: "15:00", checkOutTime: "12:00",
    imageUrl: "https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1455587734955-081b22074882?w=800&q=80","https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?w=800&q=80","https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800&q=80","https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80","https://images.unsplash.com/photo-1611892440504-42a792e24d32?w=800&q=80"],
    amenities: ["WiFi","Swimming Pool","Gym","Spa","Restaurant","Bar","Parking","Airport Shuttle","24h Front Desk","Business Center","Conference Rooms","Room Service","Concierge"],
    rooms: [
      { name: "Westin Superior Room", description: "Signature Heavenly Bed, mountain or harbour views.", price: 32000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 50, imageUrl: "https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Work Desk"] },
      { name: "Mountain View Suite", description: "Floor-to-ceiling windows framing Table Mountain, separate lounge.", price: 62000, currency: "KES", bedType: "King", maxGuests: 2, quantity: 10, imageUrl: "https://images.unsplash.com/photo-1578683010236-d716f9a3f461?w=800&q=80", amenities: ["Air Conditioning","Flat-screen TV","Mini Bar","Safe","Bathtub","Walk-in Shower","City View","Balcony","Sofa Bed"] },
    ],
    reviews: [
      { rating: 5, title: "Table Mountain views are breathtaking", comment: "Woke up to that incredible view every morning. The Heavenly Bed lives up to its name." },
      { rating: 5, title: "Luxury at its finest", comment: "The staff knew my name from day one. Will definitely be back." },
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
    reviews: [
      { rating: 4, title: "Historic charm, modern comfort", comment: "Such a wonderful piece of Nairobi history. The Thorn Tree café is iconic." },
      { rating: 5, title: "My favourite Nairobi hotel", comment: "I've stayed here on every Nairobi visit for years. The pool is a great escape." },
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
    reviews: [
      { rating: 5, title: "Best rooftop pool in Nairobi", comment: "The infinity pool with the city skyline is unbeatable. Rooms are enormous and immaculately kept." },
      { rating: 5, title: "Flawless stay", comment: "Every detail was considered. Breakfast spread is one of the best in the city." },
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
    reviews: [
      { rating: 5, title: "Westlands' best kept secret", comment: "The rooftop pool bar at sunset is unreal. Suites are spacious and the location puts you steps from everything." },
      { rating: 4, title: "Stylish and central", comment: "Loved the design and the staff were fantastic. Brunch on Sunday is worth the trip alone." },
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
    reviews: [
      { rating: 5, title: "Modern, quiet, superbly run", comment: "One of the best-designed hotels I've stayed at in East Africa. Gym and pool are excellent." },
      { rating: 4, title: "Great for business trips", comment: "Efficient check-in, strong WiFi, and the rooftop restaurant is a nice bonus." },
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
    reviews: [
      { rating: 5, title: "Impeccable service", comment: "Every member of staff greeted us by name from day two. The Karen setting feels a world away from the city." },
      { rating: 5, title: "Worth every shilling", comment: "The suite was enormous, the spa is excellent, and the Ngong Hills view from breakfast is unforgettable." },
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
    reviews: [
      { rating: 5, title: "A gallery you can sleep in", comment: "The art collection alone makes this worth a visit. Pool area and rooftop bar are stunning at night." },
      { rating: 4, title: "Chic and comfortable", comment: "Great location near Village Market. Rooms are stylish and the restaurant is excellent." },
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
    reviews: [
      { rating: 4, title: "Excellent for business travel", comment: "Great conference facilities and the rooftop pool is a wonderful way to unwind after meetings." },
      { rating: 5, title: "Views for days", comment: "Room overlooked the whole city. Staff were sharp and professional throughout our stay." },
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
    reviews: [
      { rating: 5, title: "Reliable five-star quality", comment: "Consistently excellent — great breakfast, rooftop pool with a view, and very central for Westlands." },
      { rating: 4, title: "Comfortable and convenient", comment: "Easy airport transfer, spacious rooms, and the staff were extremely helpful with dinner recommendations." },
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
    reviews: [
      { rating: 5, title: "Calm in the middle of the city", comment: "The gardens make you forget you are in the CBD. Breakfast spread is excellent." },
      { rating: 4, title: "Dependable and central", comment: "Well run, easy walk to meetings in town. Rooms are comfortable if a little traditional." },
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
    reviews: [
      { rating: 5, title: "The views are the draw", comment: "Being that high above Westlands is something else, especially at sunset from the pool." },
      { rating: 5, title: "Polished throughout", comment: "Service standards you would expect from the brand. The grill downstairs is very good." },
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
    reviews: [
      { rating: 4, title: "Great for a longer stay", comment: "The residence layout made a two-week trip feel civilised. Mall downstairs is convenient." },
      { rating: 5, title: "Quietly excellent", comment: "Less showy than its neighbours but the service was faultless." },
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
    reviews: [
      { rating: 5, title: "Best conference facilities in Westlands", comment: "Ran a two-day summit here without a single hitch. AV team were on it." },
      { rating: 4, title: "Solid business hotel", comment: "Rooms are quiet and the gym is properly equipped. Breakfast gets busy." },
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
    reviews: [
      { rating: 4, title: "Ideal for a long assignment", comment: "Having a real kitchen changed the whole trip. Weekly housekeeping was thorough." },
      { rating: 4, title: "Good value in Westlands", comment: "Not luxurious but genuinely practical, and the pool is a nice bonus." },
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
    reviews: [
      { rating: 5, title: "The arboretum outlook is lovely", comment: "Waking up to trees rather than traffic in Nairobi is rare. Very peaceful." },
      { rating: 4, title: "Comfortable and well located", comment: "Handy for Upper Hill meetings without being in the thick of it." },
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
    reviews: [
      { rating: 4, title: "Does exactly what you need", comment: "Clean, central, good WiFi. The rooftop bar is a nice way to end the day." },
      { rating: 4, title: "Good value for Westlands", comment: "Nothing fancy but well run and the location saves you hours in traffic." },
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
    reviews: [
      { rating: 4, title: "Easy with kids", comment: "The sofa bed setup meant we did not need two rooms. Pool kept everyone happy." },
      { rating: 4, title: "Reliable Accor standard", comment: "Exactly what you expect from the brand, which is a compliment." },
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
    reviews: [
      { rating: 5, title: "Feels like Nairobi, not anywhere", comment: "So many hotels could be in any city. This one is unmistakably Kenyan and it is lovely." },
      { rating: 5, title: "The rooftop is the spot", comment: "Sunset drinks up there, then dinner downstairs. Did not leave the building." },
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
    reviews: [
      { rating: 4, title: "Gardens make it", comment: "Brought the family for a weekend and the kids barely came inside." },
      { rating: 4, title: "Good conference venue", comment: "Ran a workshop here. Rooms were fine and the catering was better than expected." },
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
    reviews: [
      { rating: 4, title: "Perfect for UN business", comment: "Ten minutes from the complex and far calmer than staying in town." },
      { rating: 4, title: "Spacious and quiet", comment: "Rooms are bigger than most at this price. Staff were attentive." },
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
    reviews: [
      { rating: 5, title: "Best meal in Nairobi", comment: "The tilapia was incredible. The garden setting at sunset is magical. Service was impeccable throughout." },
      { rating: 5, title: "A must for any Nairobi visit", comment: "Extraordinary food, breathtaking setting. The lamb rack is a masterpiece. Book well in advance." },
      { rating: 4, title: "Wonderful experience", comment: "Beautiful atmosphere and creative menu. The cocktails were excellent. Slightly pricey but worth it for a special occasion." },
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
    reviews: [
      { rating: 5, title: "Best night out in Nairobi", comment: "The food is amazing and the live music is unbeatable. The peri-peri prawns are a must. We danced till closing!" },
      { rating: 4, title: "Great vibe and food", comment: "Excellent atmosphere for both dinner and a night out. The African platter was great for sharing." },
    ],
  },
  {
    name: "Buka Restaurant", city: "Lagos", location: "1 Ozumba Mbadiwe Avenue, Victoria Island, Lagos", cuisine: "Nigerian",
    description: "Buka brings the warmth and authenticity of a traditional Nigerian kitchen to Victoria Island. From slow-cooked ofe onugbu to jollof rice that has won awards, every dish is made with genuine care.",
    priceRange: 2, phone: "+234 803 456 7890", email: "hello@bukarest.com",
    imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80","https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80"],
    amenities: ["Takeaway","Outdoor Seating","Halal","Parking","WiFi"],
    openingHours: defaultHours("10:00", "22:00", "10:00", "22:00"),
    menuItems: [
      { category: "Soups & Salads", name: "Egusi Soup", description: "Ground melon seeds, assorted fish, stockfish, palm oil — with pounded yam or eba", price: 3500, sortOrder: 1 },
      { category: "Soups & Salads", name: "Banga Soup", description: "Palm nut extract, catfish, crayfish, periwinkle", price: 3800, sortOrder: 2 },
      { category: "Mains", name: "Jollof Rice (Party Style)", description: "Award-winning smoky Nigerian jollof, coleslaw, fried plantain", price: 2800, sortOrder: 1 },
      { category: "Mains", name: "Pepper Soup", description: "Goat meat, uziza leaves, Cameroonian peppers, hot pot", price: 4200, sortOrder: 2 },
      { category: "Mains", name: "Suya Platter", description: "Spiced beef skewers, onion, tomato, Zanzibari spice mix", price: 3200, sortOrder: 3 },
      { category: "Sides", name: "Pounded Yam", description: "Hand-pounded, served alongside any soup", price: 800, sortOrder: 1 },
      { category: "Sides", name: "Fried Plantain (Dodo)", description: "Sweet, ripe plantain, deep-fried", price: 600, sortOrder: 2 },
      { category: "Drinks", name: "Chapman", description: "Classic Nigerian cocktail — Fanta, Sprite, Grenadine, cucumber", price: 800, sortOrder: 1 },
      { category: "Drinks", name: "Zobo", description: "Chilled hibiscus drink, cloves, ginger", price: 500, sortOrder: 2 },
    ],
    reviews: [
      { rating: 5, title: "The real deal", comment: "If you want authentic Nigerian food in Lagos, Buka is it. The egusi soup is exactly like my grandmother's. The atmosphere is warm and welcoming." },
      { rating: 5, title: "Best jollof in Lagos", comment: "I've tried everywhere. Buka wins. The smoke on the jollof is perfect. Come hungry." },
      { rating: 4, title: "Excellent traditional food", comment: "Suya platter was outstanding. Service was friendly and fast. Great value for money." },
    ],
  },
  {
    name: "Gold Coast Restaurant", city: "Accra", location: "Liberation Road, Accra", cuisine: "Ghanaian",
    description: "Named after the country's former colonial identity, Gold Coast Restaurant celebrates modern Ghanaian cuisine. Using locally sourced ingredients, the kitchen transforms everyday West African staples into extraordinary dishes.",
    priceRange: 2, phone: "+233 20 123 4567", email: "eat@goldcoastaccra.com",
    imageUrl: "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=800&q=80","https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80"],
    amenities: ["Outdoor Seating","Halal","Takeaway","Parking","WiFi","Delivery"],
    openingHours: defaultHours("11:00", "21:30", "10:00", "22:00"),
    menuItems: [
      { category: "Starters", name: "Kelewele", description: "Spiced fried plantain, ginger, cayenne — served with groundnut dip", price: 350, sortOrder: 1 },
      { category: "Starters", name: "Chickpea Fritters", description: "Accra beancakes, chilli sauce, pickled cabbage", price: 300, sortOrder: 2 },
      { category: "Mains", name: "Jollof Rice & Grilled Tilapia", description: "Smoky Ghanaian jollof, whole grilled tilapia, fried plantain, salad", price: 1800, sortOrder: 1 },
      { category: "Mains", name: "Fufu & Light Soup", description: "Hand-pounded yam and cassava, goat light soup, garden egg stew", price: 1600, sortOrder: 2 },
      { category: "Mains", name: "Kontomire Stew", description: "Cocoyam leaves, smoked fish, boiled yam", price: 1400, sortOrder: 3 },
      { category: "Desserts", name: "Coconut Ice Cream", description: "Fresh Ghanaian coconut, mango coulis", price: 400, sortOrder: 1 },
      { category: "Juices", name: "Fresh Sobolo", description: "Hibiscus, cloves, ginger, natural sweetener", price: 300, sortOrder: 1 },
      { category: "Juices", name: "Tamarind Lemonade", description: "Tamarind, fresh lemon, mint", price: 350, sortOrder: 2 },
    ],
    reviews: [
      { rating: 5, title: "Authentic Ghanaian flavours", comment: "The fufu and light soup is exactly how my mother makes it. So comforting and delicious. Great outdoor seating." },
      { rating: 4, title: "Lovely local experience", comment: "Perfect for visitors wanting to experience real Ghanaian food. The kelewele is addictive. Good prices." },
    ],
  },
  {
    name: "De Waterkant Kitchen", city: "Cape Town", location: "9 Loader Street, De Waterkant, Cape Town", cuisine: "Contemporary",
    description: "Tucked in Cape Town's historic De Waterkant village, this modern brasserie celebrates South African produce with European technique. The ever-changing seasonal menu showcases the best from the Cape's farm-to-table bounty.",
    priceRange: 3, phone: "+27 21 419 2501", email: "bookings@dewaterkant.co.za",
    imageUrl: "https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1559339352-11d035aa65de?w=800&q=80","https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&q=80","https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=800&q=80"],
    amenities: ["Outdoor Seating","Bar","Vegan Options","Vegetarian Options","Wheelchair Accessible","Reservations Required"],
    openingHours: { ...defaultHours("12:00", "22:00", "10:00", "23:00"), monday: { open: "12:00", close: "22:00", closed: false }, sunday: { open: "10:00", close: "16:00", closed: false } },
    menuItems: [
      { category: "Starters", name: "Biltong & Blue Cheese Arancini", description: "South African biltong, gorgonzola, tomato jam", price: 120, sortOrder: 1 },
      { category: "Starters", name: "Cape Malay Salad", description: "Cape Malay pickled fish, gem lettuce, apricot dressing", price: 95, sortOrder: 2 },
      { category: "Mains", name: "Braai-spiced Springbok", description: "Free-range springbok loin, roast beetroot, Cape gooseberry jus", price: 380, sortOrder: 1 },
      { category: "Mains", name: "Bokaap Lamb Shoulder", description: "Slow-roasted Cape Malay-spiced lamb, jewelled couscous", price: 320, sortOrder: 2 },
      { category: "Mains", name: "Garden Cape Mezze", description: "Seasonal vegetarian board, hummus, breads, Cape pickles", price: 185, sortOrder: 3 },
      { category: "Desserts", name: "Malva Pudding", description: "Traditional Cape pudding, amarula custard, vanilla ice cream", price: 90, sortOrder: 1 },
      { category: "Wines", name: "Boekenhoutskloof Syrah", description: "Franschhoek · Glass", price: 110, sortOrder: 1 },
      { category: "Wines", name: "Waterford Sauvignon Blanc", description: "Stellenbosch · Glass", price: 95, sortOrder: 2 },
    ],
    reviews: [
      { rating: 5, title: "Cape Town dining at its best", comment: "The springbok was cooked to perfection and the wine list is exceptional. Beautiful outdoor terrace." },
      { rating: 4, title: "Seasonal and delicious", comment: "Loved the Cape Malay salad and the malva pudding. The biltong arancini is a genius idea." },
      { rating: 5, title: "A Cape Town gem", comment: "Perfect neighbourhood bistro. The food is creative, the service warm, and the Waterkant vibe is unbeatable." },
    ],
  },
  {
    name: "Serena Coffee House", city: "Kigali", location: "KN 3 Ave, Kiyovu, Kigali", cuisine: "International",
    description: "The coffee house and all-day dining venue at Kigali Serena Hotel, serving exceptional Rwandan single-origin coffees alongside an international menu that draws on flavours from across Africa and beyond.",
    priceRange: 2, phone: "+250 252 597 100", email: "kigali@serena.co.rw",
    imageUrl: "https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80",
    images: ["https://images.unsplash.com/photo-1445116572660-236099ec97a0?w=800&q=80","https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&q=80"],
    amenities: ["WiFi","Outdoor Seating","Vegan Options","Vegetarian Options","Takeaway","Wheelchair Accessible"],
    openingHours: defaultHours("06:30", "22:00", "07:00", "22:00"),
    menuItems: [
      { category: "Starters", name: "Avocado Toast", description: "Rwandan avocado, sourdough, cherry tomatoes, dukkah", price: 950, sortOrder: 1 },
      { category: "Mains", name: "Club Sandwich", description: "Grilled chicken, bacon, egg, lettuce, tomato, fries", price: 1600, sortOrder: 1 },
      { category: "Mains", name: "Rwandan Brochettes", description: "Marinated beef skewers, grilled vegetables, pilau rice", price: 2200, sortOrder: 2 },
      { category: "Mains", name: "Garden Salad Bowl", description: "Seasonal greens, chickpeas, roasted butternut, tahini dressing", price: 1200, sortOrder: 3 },
      { category: "Desserts", name: "Passion Fruit Cheesecake", description: "Kigali-style cheesecake with fresh passion fruit", price: 650, sortOrder: 1 },
      { category: "Drinks", name: "Rwanda Single Origin Coffee", description: "Bourbon arabica, Huye Mountain — black, flat white, or cappuccino", price: 500, sortOrder: 1 },
      { category: "Juices", name: "Fresh Tropical Juice", description: "Mango, passion fruit, pineapple — pressed to order", price: 700, sortOrder: 1 },
    ],
    reviews: [
      { rating: 4, title: "Great coffee and food", comment: "The Rwandan coffee is some of the best I've had anywhere. Brochettes were excellent. Perfect for breakfast meetings." },
      { rating: 5, title: "Peaceful and delicious", comment: "The garden seating is so tranquil. Food is well-executed and the service is genuinely warm. A daily ritual during my Kigali stay." },
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
    reviews: [
      { rating: 5, title: "A Nairobi institution", comment: "Every visitor to Nairobi needs to experience this at least once. The carving is theatrical and the meat never stops coming." },
      { rating: 4, title: "Meat lover's paradise", comment: "Come hungry. The variety is incredible and the live band adds great atmosphere." },
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
    reviews: [
      { rating: 5, title: "Best brunch in Westlands", comment: "Consistently good food in a relaxed garden setting. The eggs benedict is a weekend ritual for us." },
      { rating: 4, title: "Reliable and comfortable", comment: "Great for a business lunch or catching up with friends. Service is friendly and unhurried." },
    ],
  },
  {
    name: "Cultiva Farm to Table", city: "Nairobi", location: "Rosslyn, Nairobi", cuisine: "Farm-to-Table",
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
    reviews: [
      { rating: 5, title: "You can taste the difference", comment: "Everything feels genuinely fresh. Lovely spot to bring kids — they loved seeing the farm." },
      { rating: 5, title: "A Nairobi favourite for a reason", comment: "The seasonal menu keeps it interesting every visit. Peaceful garden setting." },
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
    reviews: [
      { rating: 5, title: "Best seafood in the city", comment: "The snapper was outstanding and the rooftop vibe at night is unmatched in Nairobi." },
      { rating: 4, title: "Great for a special night out", comment: "Pricey but worth it. Cocktails are excellent and the DJ sets the mood perfectly." },
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
    reviews: [
      { rating: 4, title: "Reliable Italian comfort food", comment: "Great pizza and generous pasta portions. Lovely courtyard for a relaxed dinner." },
      { rating: 5, title: "A Kilimani classic", comment: "Been coming here for years, never disappoints. Carbonara is the real deal." },
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
    reviews: [
      { rating: 5, title: "Kenyan food, elevated", comment: "Fun, colourful spot with genuinely great food. The nyama choma platter is a must-order." },
      { rating: 4, title: "Great brunch spot", comment: "Loved the mandazi french toast. Buzzy atmosphere, good for groups." },
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
    reviews: [
      { rating: 5, title: "Best Japanese food in Nairobi", comment: "The sashimi is remarkably fresh for a landlocked city. Elegant, quiet setting for a special dinner." },
      { rating: 5, title: "Consistently outstanding", comment: "Never had a bad meal here. The teppanyaki is theatrical and delicious." },
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
    reviews: [
      { rating: 5, title: "Real, authentic Luo food", comment: "This is exactly how tilapia should taste. No frills, just excellent home-style cooking." },
      { rating: 5, title: "A Nairobi CBD gem", comment: "Great value, fast service, and genuinely delicious traditional food." },
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
    reviews: [
      { rating: 4, title: "Consistent every time", comment: "You know exactly what you're getting — reliable coffee and comfort food across the city." },
      { rating: 4, title: "Great for working lunches", comment: "Fast WiFi, good coffee, easy to get a table." },
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
    reviews: [
      { rating: 5, title: "Best croissants in Nairobi", comment: "The bakery counter alone is worth the visit. Great spot for meetings over coffee." },
      { rating: 4, title: "Dependable and delicious", comment: "Never disappoints. The avocado toast is a regular order for me." },
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
    reviews: [
      { rating: 5, title: "Best burger in the city", comment: "Juicy, generously topped, and the fries are perfectly crispy. Always my go-to." },
      { rating: 4, title: "Great casual spot", comment: "Fast, tasty, good value. The loaded fries are dangerous." },
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
    reviews: [
      { rating: 5, title: "Transportive experience", comment: "Feels like dining in Addis. The mixed platter is generous and full of flavour. Coffee ceremony is a treat." },
      { rating: 5, title: "Nairobi's best Ethiopian food", comment: "Warm hospitality, great vegan options, and the weekend music makes it a real event." },
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
    reviews: [
      { rating: 5, title: "Genuine Italian craftsmanship", comment: "The pasta is handmade and it shows. Wine list is one of the best in Nairobi." },
      { rating: 5, title: "Special occasion perfection", comment: "Intimate, elegant, and the osso buco was faultless. Book ahead, it fills up fast." },
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
    reviews: [
      { rating: 5, title: "Real French bakery, finally", comment: "The croissants rival anything I've had in Paris. Baguette is spot on too." },
      { rating: 4, title: "Charming bistro lunch", comment: "Steak frites was excellent. Lovely quiet spot for a proper lunch." },
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
    reviews: [
      { rating: 4, title: "Solid casual nyama choma", comment: "Great for a laid-back night with friends. Meat is well grilled and generously portioned." },
      { rating: 4, title: "Popular for a reason", comment: "Always busy but service keeps up. Good value grill spot." },
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
    reviews: [
      { rating: 5, title: "Meat lover's dream", comment: "Non-stop carving, every cut cooked perfectly. Great for celebrations." },
      { rating: 4, title: "Impressive spread", comment: "Salad bar alone is worth the visit, and the picanha is exceptional." },
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
    reviews: [
      { rating: 5, title: "Great atmosphere and food", comment: "The rooftop terrace at night is fantastic. Sushi and the ribeye were both excellent." },
      { rating: 4, title: "Lively Kilimani spot", comment: "Good mix of dining and nightlife. Cocktails are strong and creative." },
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
    reviews: [
      { rating: 4, title: "Good value seafood", comment: "Reliable and affordable for seafood in a landlocked city. Kids loved the calamari." },
      { rating: 4, title: "Family friendly favourite", comment: "Casual, quick, and the platter for two is generous." },
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
    reviews: [
      { rating: 5, title: "The best cooking in Nairobi right now", comment: "The tiradito was genuinely world class. Get a window table before sunset." },
      { rating: 5, title: "Worth the hype", comment: "Skeptical going in, converted by the second course. The black cod is the order." },
      { rating: 4, title: "Stunning but book ahead", comment: "Food and views both excellent. Impossible to get a table on short notice." },
    ],
  },
  {
    name: "Osteria del Chianti", city: "Nairobi", location: "Lenana Road, Kilimani, Nairobi", cuisine: "Italian",
    description: "The Lenana Road original of Nairobi's best-known Italian family — wood-fired pizza, hand-rolled pasta and a Tuscan wine list, in a courtyard that fills every Friday.",
    priceRange: 3, phone: "+254 20 000 0000", email: "lenana@osteria.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.fine, DINING_IMG.bar],
    amenities: ["Outdoor Seating","Bar","Parking","Takeaway","Vegetarian Options","Family Friendly"],
    openingHours: defaultHours("11:30", "22:30", "11:00", "23:00"),
    menuItems: [
      { category: "Antipasti", name: "Burrata e Pomodorini", description: "Imported burrata, confit cherry tomatoes, basil", price: 1450, sortOrder: 1 },
      { category: "Antipasti", name: "Carpaccio di Manzo", description: "Kenyan beef fillet, rocket, parmesan, lemon", price: 1350, sortOrder: 2 },
      { category: "Pasta", name: "Tagliatelle al Ragù", description: "Slow-cooked beef ragù, hand-cut tagliatelle", price: 1700, sortOrder: 1 },
      { category: "Pasta", name: "Ravioli di Ricotta e Spinaci", description: "Ricotta and spinach ravioli, sage butter", price: 1600, sortOrder: 2 },
      { category: "Pizza", name: "Pizza Diavola", description: "Spicy salami, mozzarella, chilli oil", price: 1450, sortOrder: 1 },
      { category: "Pizza", name: "Pizza Margherita", description: "San Marzano tomato, fior di latte, basil", price: 1150, sortOrder: 2 },
      { category: "Desserts", name: "Tiramisù", description: "Made in house, to the family recipe", price: 750, sortOrder: 1 },
    ],
    reviews: [
      { rating: 5, title: "Proper Italian in Nairobi", comment: "The ragù tastes like someone's nonna made it. Pizza base is excellent." },
      { rating: 4, title: "Always good, always busy", comment: "Been coming for years. Book on weekends or you will wait." },
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
    reviews: [
      { rating: 4, title: "Best steak in Nairobi", comment: "The dry-aged ribeye is a serious piece of meat. Garden setting is relaxed." },
      { rating: 4, title: "Great for a group", comment: "The tomahawk fed three of us comfortably. Service was slow but friendly." },
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
    reviews: [
      { rating: 5, title: "Best breakfast in Karen", comment: "Everything tastes fresh because it genuinely is. The shop is dangerous for the wallet." },
      { rating: 4, title: "Lovely spot to work from", comment: "Good coffee, decent WiFi, quiet on weekday mornings." },
    ],
  },

  // ── Cuisine specialists ────────────────────────────────────────────────────
  {
    name: "Habesha Restaurant", city: "Nairobi", location: "Argwings Kodhek Road, Kilimani, Nairobi", cuisine: "Ethiopian",
    description: "Nairobi's long-running Ethiopian institution — injera platters shared around a mesob basket, slow-simmered wats, and a coffee ceremony worth staying for.",
    priceRange: 2, phone: "+254 20 000 0000", email: "info@habesha.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Outdoor Seating","Bar","Parking","Live Music","Vegan Options","Vegetarian Options","Halal"],
    openingHours: defaultHours("11:00", "23:00", "11:00", "23:30"),
    menuItems: [
      { category: "Platters", name: "Habesha Combination", description: "Seven wats on injera — the full introduction, serves two", price: 2600, sortOrder: 1 },
      { category: "Platters", name: "Beyaynetu Vegetarian", description: "Lentil, split pea, collard and beetroot wats on injera", price: 1600, sortOrder: 2 },
      { category: "Mains", name: "Doro Wat", description: "Slow-cooked chicken, berbere, hard-boiled egg", price: 1500, sortOrder: 1 },
      { category: "Mains", name: "Kitfo", description: "Minced beef, mitmita, niter kibbeh, ayib cheese", price: 1800, sortOrder: 2 },
      { category: "Drinks", name: "Ethiopian Coffee Ceremony", description: "Roasted, ground and brewed at your table", price: 900, sortOrder: 1 },
      { category: "Drinks", name: "Tej", description: "Traditional Ethiopian honey wine", price: 700, sortOrder: 2 },
    ],
    reviews: [
      { rating: 5, title: "The real thing", comment: "Doro wat as good as I have had in Addis. Do the coffee ceremony, it is worth the wait." },
      { rating: 4, title: "Great for vegetarians", comment: "The beyaynetu is enormous and every component is distinct." },
    ],
  },
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
    reviews: [
      { rating: 5, title: "Consistently excellent for years", comment: "The overnight dal is the reason to come. Nothing else in town matches it." },
      { rating: 4, title: "Reliable and generous", comment: "Portions are big, spicing is confident. Book for weekend dinner." },
    ],
  },
  {
    name: "K'Osewe Ranalo Foods", city: "Nairobi", location: "Kimathi Street, Central Business District, Nairobi", cuisine: "Kenyan Traditional",
    description: "The CBD institution for Luo home cooking — whole fried tilapia, dry-fry beef, managu and ugali, served fast to a room of civil servants, lawyers and everyone else.",
    priceRange: 1, phone: "+254 20 000 0000", email: "info@kosewe.example",
    imageUrl: DINING_IMG.casual, images: [DINING_IMG.casual, DINING_IMG.grill],
    amenities: ["Takeaway","Family Friendly","Halal","Group Dining"],
    openingHours: defaultHours("07:00", "22:00", "08:00", "22:00"),
    menuItems: [
      { category: "Fish", name: "Whole Fried Tilapia", description: "Lake Victoria tilapia, kachumbari, ugali", price: 950, sortOrder: 1 },
      { category: "Fish", name: "Fish Stew", description: "Tilapia in tomato and onion broth", price: 850, sortOrder: 2 },
      { category: "Meat", name: "Dry Fry Beef", description: "Slow-fried beef, onion, chilli", price: 700, sortOrder: 1 },
      { category: "Meat", name: "Matumbo", description: "Traditional tripe, well spiced", price: 550, sortOrder: 2 },
      { category: "Vegetables", name: "Managu", description: "African nightshade with milk and onion", price: 300, sortOrder: 1 },
      { category: "Sides", name: "Ugali", description: "Stone-ground white maize", price: 150, sortOrder: 1 },
    ],
    reviews: [
      { rating: 5, title: "The tilapia is the reason", comment: "No frills, no decor, just the best whole fish in the CBD. Cash is easiest." },
      { rating: 4, title: "Authentic and cheap", comment: "Lunchtime queues for good reason. Managu and ugali done properly." },
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
    reviews: [
      { rating: 4, title: "Best sushi in Nairobi", comment: "Fish quality is genuinely good given how far we are from the sea." },
      { rating: 5, title: "The ramen surprised me", comment: "Came for sushi, will return for the tonkotsu. Broth is the real thing." },
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
    reviews: [
      { rating: 5, title: "Sunset here is the Nairobi move", comment: "Get there by six, take a poolside table, order the dawa. Perfect." },
      { rating: 4, title: "Great atmosphere", comment: "Buzzy on weekends. Food is good rather than remarkable, but you come for the setting." },
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
    reviews: [
      { rating: 5, title: "Thoughtful, not gimmicky", comment: "African fine dining that respects the ingredients rather than dressing them up. Short rib was superb." },
      { rating: 4, title: "Lovely breakfast too", comment: "Stayed at Tribe and ate here every morning. The à la carte menu is worth ordering from." },
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
    reviews: [
      { rating: 5, title: "The truffle tagliolini is worth it", comment: "Expensive but genuinely excellent. Wine list is the best in Nairobi." },
      { rating: 4, title: "Formal in a good way", comment: "Proper service, quiet room, ideal for a business dinner." },
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
    reviews: [
      { rating: 4, title: "The business lunch actually is quick", comment: "In and out in under an hour with a decent meal. Rare in Nairobi." },
      { rating: 4, title: "Good buffet breakfast", comment: "Wide spread, eggs cooked properly, coffee kept coming." },
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
    reviews: [
      { rating: 4, title: "Cacio e pepe done right", comment: "Emulsified properly, no clumps. That alone puts it ahead of most." },
      { rating: 4, title: "Nice terrace for lunch", comment: "Quiet at midday, good for a long conversation." },
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
      for (const rv of h.reviews) await prisma.hotelReview.create({ data: { hotelId: hotel.id, userId: customerUser.id, ...rv } });
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
      for (const rv of r.reviews) await prisma.restaurantReview.create({ data: { restaurantId: restaurant.id, userId: customerUser.id, ...rv } });
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
  console.log("   customer@dontbeboring.example  → Customer (used for seeded reviews)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

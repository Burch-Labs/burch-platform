import {
  PrismaClient,
  EventCategory,
  UserRole,
  PartnerStatus,
} from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

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
];

// ─── Hotels ───────────────────────────────────────────────────────────────────

const HOTELS = [
  {
    name: "The Norfolk Nairobi", city: "Nairobi", location: "Harry Thuku Road, Nairobi", starRating: 5,
    description: "Nairobi's most iconic hotel since 1904. Colonial charm meets modern luxury, set in beautifully landscaped gardens in the heart of the city.",
    phone: "+254 20 226 5000", email: "norfolk@serena.co.ke", checkInTime: "14:00", checkOutTime: "11:00",
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
];

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("🌱 Seeding Burch Platform database…\n");

  // Users
  const [eventP1User, eventP2User, hotelPartnerUser, restaurantPartnerUser, adminUser, customerUser] =
    await Promise.all([
      prisma.user.upsert({ where: { email: "events@burch.africa" }, update: {}, create: { name: "Burch Events Co.", email: "events@burch.africa", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "continental@burch.africa" }, update: {}, create: { name: "Continental Productions", email: "continental@burch.africa", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "hotels@burch.africa" }, update: {}, create: { name: "Burch Hotels", email: "hotels@burch.africa", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "dining@burch.africa" }, update: {}, create: { name: "Burch Dining", email: "dining@burch.africa", password: await hash("Password123!", 12), role: UserRole.PARTNER, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "admin@burch.africa" }, update: {}, create: { name: "Admin", email: "admin@burch.africa", password: await hash("Password123!", 12), role: UserRole.ADMIN, emailVerified: new Date() } }),
      prisma.user.upsert({ where: { email: "customer@burch.africa" }, update: {}, create: { name: "Alex Osei", email: "customer@burch.africa", password: await hash("Password123!", 12), role: UserRole.CUSTOMER, emailVerified: new Date() } }),
    ]);

  // Partners
  const [eventP1, eventP2, hotelPartner, restaurantPartner] = await Promise.all([
    prisma.partner.upsert({ where: { userId: eventP1User.id }, update: {}, create: { userId: eventP1User.id, name: "Burch Events Co.", description: "Africa's leading event management company.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: eventP2User.id }, update: {}, create: { userId: eventP2User.id, name: "Continental Productions", description: "From Lagos to Nairobi, we produce unforgettable experiences.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: hotelPartnerUser.id }, update: {}, create: { userId: hotelPartnerUser.id, name: "Burch Hotels Collection", description: "Curating Africa's finest hotel experiences.", status: PartnerStatus.APPROVED } }),
    prisma.partner.upsert({ where: { userId: restaurantPartnerUser.id }, update: {}, create: { userId: restaurantPartnerUser.id, name: "Burch Dining Group", description: "Africa's premier restaurant collection.", status: PartnerStatus.APPROVED } }),
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
  console.log("   admin@burch.africa     → Admin");
  console.log("   events@burch.africa    → Events Partner");
  console.log("   hotels@burch.africa    → Hotels Partner");
  console.log("   dining@burch.africa    → Dining Partner");
  console.log("   customer@burch.africa  → Customer (used for seeded reviews)");
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());

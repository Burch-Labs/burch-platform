import { PrismaClient, EventCategory, UserRole, PartnerStatus } from "@prisma/client";
import { hash } from "bcryptjs";

const prisma = new PrismaClient();

const events: Array<{
  title: string;
  description: string;
  category: EventCategory;
  city: string;
  location: string;
  price: number;
  capacity: number;
  daysFromNow: number;
  durationHours: number;
  tags: string[];
  imageUrl?: string;
}> = [
  {
    title: "Nairobi Jazz Festival 2025",
    description:
      "The premier jazz festival in East Africa returns for its 12th edition. Featuring world-class jazz artists from across the continent and beyond. Enjoy three stages of live music, local cuisine, and the magic of Nairobi nights.\n\nDoors open at 5 PM. Main act starts at 8 PM.",
    category: EventCategory.MUSIC,
    city: "Nairobi",
    location: "Ngong Racecourse, Ngong Road",
    price: 2500,
    capacity: 5000,
    daysFromNow: 14,
    durationHours: 8,
    tags: ["jazz", "live-music", "festival", "outdoor"],
    imageUrl: "https://images.unsplash.com/photo-1514320291840-2e0a9bf2a9ae?w=800&q=80",
  },
  {
    title: "Lagos Tech Summit 2025",
    description:
      "Africa's largest technology conference, bringing together founders, engineers, and investors building the future of the continent.\n\nThis year's theme: \"AI for Africa\" — two days of keynotes, workshops, and networking.",
    category: EventCategory.TECH,
    city: "Lagos",
    location: "Eko Convention Centre, Victoria Island",
    price: 15000,
    capacity: 2000,
    daysFromNow: 21,
    durationHours: 9,
    tags: ["technology", "ai", "startup", "networking"],
    imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80",
  },
  {
    title: "Accra Food & Wine Festival",
    description:
      "A celebration of West African cuisine, craft beers, and fine wines. Over 50 restaurants and vendors showcase the best of Ghanaian and pan-African food culture.\n\nEnjoy cooking demonstrations, wine pairings, and live highlife music.",
    category: EventCategory.FOOD_DRINK,
    city: "Accra",
    location: "Labadi Beach Hotel Grounds",
    price: 1800,
    capacity: 3000,
    daysFromNow: 7,
    durationHours: 7,
    tags: ["food", "wine", "culture", "highlife"],
    imageUrl: "https://images.unsplash.com/photo-1567620905732-2d1ec7ab7445?w=800&q=80",
  },
  {
    title: "Cape Town Comedy Night",
    description:
      "An evening of laughs featuring the hottest stand-up comedians from across South Africa. Hosted by award-winning comedian Loyiso Gola.\n\nFull bar available. 18+ event.",
    category: EventCategory.COMEDY,
    city: "Cape Town",
    location: "The Baxter Theatre, Rondebosch",
    price: 350,
    capacity: 400,
    daysFromNow: 5,
    durationHours: 3,
    tags: ["comedy", "stand-up", "nightlife"],
    imageUrl: "https://images.unsplash.com/photo-1527224857830-43a7acc85260?w=800&q=80",
  },
  {
    title: "Kampala Marathon 2025",
    description:
      "Uganda's biggest running event returns! Choose from the Full Marathon (42km), Half Marathon (21km), or Fun Run (5km). All fitness levels welcome.\n\nFinishers receive medals. Top 3 in each category win cash prizes.",
    category: EventCategory.SPORTS,
    city: "Kampala",
    location: "Kololo Airstrip, starting line",
    price: 500,
    capacity: 8000,
    daysFromNow: 30,
    durationHours: 6,
    tags: ["marathon", "running", "fitness", "outdoor"],
    imageUrl: "https://images.unsplash.com/photo-1452626038306-9aae5e071dd3?w=800&q=80",
  },
  {
    title: "Johannesburg Art Week",
    description:
      "A week-long celebration of contemporary African art featuring gallery openings, artist talks, and live painting sessions across Johannesburg's vibrant arts district.",
    category: EventCategory.ARTS,
    city: "Johannesburg",
    location: "Maboneng Precinct, Arts on Main",
    price: 0,
    capacity: 1000,
    daysFromNow: 10,
    durationHours: 8,
    tags: ["art", "gallery", "contemporary", "free"],
    imageUrl: "https://images.unsplash.com/photo-1531913223931-b0d3198229ee?w=800&q=80",
  },
  {
    title: "Kigali Business Summit",
    description:
      "Rwanda's flagship business event connecting entrepreneurs, investors, and policy makers. This year's focus: sustainable business models, green energy, and fintech in East Africa.",
    category: EventCategory.BUSINESS,
    city: "Kigali",
    location: "Kigali Convention Centre",
    price: 25000,
    capacity: 800,
    daysFromNow: 45,
    durationHours: 8,
    tags: ["business", "investment", "fintech", "sustainability"],
    imageUrl: "https://images.unsplash.com/photo-1515187029135-18ee286d815b?w=800&q=80",
  },
  {
    title: "Dar es Salaam Film Festival",
    description:
      "East Africa's premier film festival showcasing the best in African cinema. Screenings of feature films, documentaries, and short films from 20+ countries.\n\nFilmmakers Q&A sessions after each screening.",
    category: EventCategory.FILM,
    city: "Dar es Salaam",
    location: "Diamond Jubilee Hall",
    price: 800,
    capacity: 600,
    daysFromNow: 18,
    durationHours: 5,
    tags: ["film", "cinema", "african-stories", "culture"],
    imageUrl: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&q=80",
  },
  {
    title: "Nairobi AfroBeats Night",
    description:
      "The hottest Afrobeats night in Nairobi featuring live performances and DJ sets. Special guest artists flown in from Lagos and Accra.\n\nVIP tables available. General admission standing.",
    category: EventCategory.MUSIC,
    city: "Nairobi",
    location: "Carnivore Restaurant, Langata",
    price: 1200,
    capacity: 1500,
    daysFromNow: 9,
    durationHours: 6,
    tags: ["afrobeats", "nightlife", "dancing", "live-music"],
    imageUrl: "https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80",
  },
  {
    title: "Cairo Design Week",
    description:
      "A celebration of Egyptian and pan-African design talent — from fashion and architecture to product design and digital art. Workshops, exhibitions, and pop-up shops.",
    category: EventCategory.ARTS,
    city: "Cairo",
    location: "GrEEK Campus, Downtown Cairo",
    price: 300,
    capacity: 2000,
    daysFromNow: 25,
    durationHours: 8,
    tags: ["design", "fashion", "architecture", "creative"],
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800&q=80",
  },
];

async function main() {
  console.log("🌱 Seeding database…");

  // Create two organiser accounts
  const organisers = await Promise.all([
    prisma.user.upsert({
      where: { email: "events@burch.africa" },
      update: {},
      create: {
        name: "Burch Events",
        email: "events@burch.africa",
        password: await hash("Password123!", 12),
        role: UserRole.PARTNER,
        emailVerified: new Date(),
      },
    }),
    prisma.user.upsert({
      where: { email: "continental@burch.africa" },
      update: {},
      create: {
        name: "Continental Productions",
        email: "continental@burch.africa",
        password: await hash("Password123!", 12),
        role: UserRole.PARTNER,
        emailVerified: new Date(),
      },
    }),
  ]);

  const partners = await Promise.all([
    prisma.partner.upsert({
      where: { userId: organisers[0].id },
      update: {},
      create: {
        userId: organisers[0].id,
        name: "Burch Events Co.",
        description:
          "Africa's leading event management company, producing world-class concerts, festivals, and cultural experiences across the continent since 2010.",
        status: PartnerStatus.APPROVED,
      },
    }),
    prisma.partner.upsert({
      where: { userId: organisers[1].id },
      update: {},
      create: {
        userId: organisers[1].id,
        name: "Continental Productions",
        description:
          "From Lagos to Nairobi, we produce unforgettable experiences — tech summits, food festivals, film screenings, and everything in between.",
        status: PartnerStatus.APPROVED,
      },
    }),
  ]);

  // Create events (split between the two partners)
  let created = 0;
  for (let i = 0; i < events.length; i++) {
    const e = events[i];
    const partner = partners[i % 2];

    const startDate = new Date();
    startDate.setDate(startDate.getDate() + e.daysFromNow);
    startDate.setHours(18, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setHours(startDate.getHours() + e.durationHours);

    // Use title as a stable unique key to avoid duplicates on re-seed
    const existing = await prisma.event.findFirst({
      where: { title: e.title, partnerId: partner.id },
    });

    if (!existing) {
      await prisma.event.create({
        data: {
          partnerId: partner.id,
          title: e.title,
          description: e.description,
          category: e.category,
          city: e.city,
          location: e.location,
          price: e.price,
          currency: "KES",
          capacity: e.capacity,
          tags: e.tags,
          imageUrl: e.imageUrl ?? null,
          published: true,
          startDate,
          endDate,
        },
      });
      created++;
    }
  }

  // Create demo admin
  await prisma.user.upsert({
    where: { email: "admin@burch.africa" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@burch.africa",
      password: await hash("Password123!", 12),
      role: UserRole.ADMIN,
      emailVerified: new Date(),
    },
  });

  console.log(`✅ Seeded ${created} new events (${events.length - created} already existed)`);
  console.log("\nDemo accounts:");
  console.log("  Admin:   admin@burch.africa / Password123!");
  console.log("  Partner: events@burch.africa / Password123!");
  console.log("  Partner: continental@burch.africa / Password123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

import dotenv from "dotenv"
import path from "path"

const root = process.cwd()
dotenv.config({ path: path.join(root, ".env") })
dotenv.config({ path: path.join(root, ".env.local") })

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create a .env or .env.local file with DATABASE_URL=...")
  process.exit(1)
}

import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { TEST_PASSWORD, TEST_ACCOUNTS } from "../lib/test-credentials"

let prisma: PrismaClient

async function main() {
  prisma = new PrismaClient()

  console.log("Clearing existing data...")
  // Clear in dependency order
  await prisma.$executeRawUnsafe(`
    DO $$ BEGIN
      DELETE FROM post_likes;
      DELETE FROM post_saves;
      DELETE FROM comments;
      DELETE FROM posts;
      DELETE FROM messages;
      DELETE FROM conversation_members;
      DELETE FROM conversations;
      DELETE FROM notifications;
      DELETE FROM submissions;
      DELETE FROM casting_requirements;
      DELETE FROM castings;
      DELETE FROM media_assets;
      DELETE FROM follows;
      DELETE FROM refresh_tokens;
      DELETE FROM user_settings;
      DELETE FROM digital_twins;
      DELETE FROM agency_applications;
      DELETE FROM availability_dates;
      DELETE FROM blocks;
      DELETE FROM reports;
      DELETE FROM saved_models;
      DELETE FROM profile_views;
      DELETE FROM casting_views;
      DELETE FROM earnings;
      DELETE FROM story_views;
      DELETE FROM stories;
      DELETE FROM story_highlights;
      DELETE FROM direct_bookings;
      DELETE FROM room_events;
      DELETE FROM room_files;
      DELETE FROM room_schedule_items;
      DELETE FROM model_profiles;
      DELETE FROM agency_profiles;
      DELETE FROM brand_profiles;
      DELETE FROM client_profiles;
      DELETE FROM profiles;
      DELETE FROM users;
    EXCEPTION WHEN undefined_table THEN NULL;
    END $$;
  `)

  const hash = await bcrypt.hash(TEST_PASSWORD, 12)
  console.log("Password hashed. Creating 40 accounts...")

  // ── BRANDS (10) ──
  const brandData = [
    { ...TEST_ACCOUNTS.brands[0], bio: "Maison Christian Dior. Haute Couture, Ready-to-Wear, Beauty.", location: "Paris, France", website: "https://dior.com" },
    { ...TEST_ACCOUNTS.brands[1], bio: "Founded in Florence in 1921. One of the world's leading luxury fashion brands.", location: "Florence, Italy", website: "https://gucci.com" },
    { ...TEST_ACCOUNTS.brands[2], bio: "Iconic French fashion house. Timeless elegance since 1910.", location: "Paris, France", website: "https://chanel.com" },
    { ...TEST_ACCOUNTS.brands[3], bio: "Italian luxury fashion house. Challenging conventions since 1913.", location: "Milan, Italy", website: "https://prada.com" },
    { ...TEST_ACCOUNTS.brands[4], bio: "British luxury brand. Heritage, innovation, and craftsmanship.", location: "London, UK", website: "https://burberry.com" },
    { ...TEST_ACCOUNTS.brands[5], bio: "Bold Italian glamour. Versace is not just fashion, it's a lifestyle.", location: "Milan, Italy", website: "https://versace.com" },
    { ...TEST_ACCOUNTS.brands[6], bio: "Avant-garde fashion house. Pushing boundaries since 1917.", location: "Paris, France", website: "https://balenciaga.com" },
    { ...TEST_ACCOUNTS.brands[7], bio: "Roman luxury house known for fur, leather goods, and accessories.", location: "Rome, Italy", website: "https://fendi.com" },
    { ...TEST_ACCOUNTS.brands[8], bio: "French luxury goods manufacturer. Artisanship since 1837.", location: "Paris, France", website: "https://hermes.com" },
    { ...TEST_ACCOUNTS.brands[9], bio: "Global fashion powerhouse. Art, travel, and craftsmanship.", location: "Paris, France", website: "https://louisvuitton.com" },
  ]

  const brands: string[] = []
  for (const b of brandData) {
    const user = await prisma.user.create({
      data: {
        email: b.email,
        username: b.username,
        passwordHash: hash,
        displayName: b.name,
        role: Role.BRAND,
        isDemo: true,
        authProvider: "demo",
        profile: { create: { displayName: b.name, bio: b.bio, location: b.location, verificationStatus: "LUXLANE_VERIFIED", avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(b.name)}&background=1a1a2e&color=e94560&size=200&bold=true` } },
        brandProfile: { create: { brandName: b.name, website: b.website, verified: true } },
        settings: { create: { darkMode: true } },
      },
    })
    brands.push(user.id)
    console.log(`  Brand: ${b.name} (${b.email})`)
  }

  // ── AGENCIES (10) ──
  const agencyData = [
    { ...TEST_ACCOUNTS.agencies[0], bio: "The world's leading model management agency. Discovering beauty since 1972.", location: "New York, NY", website: "https://elitemodel.com" },
    { ...TEST_ACCOUNTS.agencies[1], bio: "Next Model Management. Offices in NY, LA, Paris, Milan, London.", location: "New York, NY", website: "https://nextmodels.com" },
    { ...TEST_ACCOUNTS.agencies[2], bio: "IMG Models is the international leader in talent discovery.", location: "New York, NY", website: "https://imgmodels.com" },
    { ...TEST_ACCOUNTS.agencies[3], bio: "Wilhelmina Models. Representing top talent across fashion, beauty, and entertainment.", location: "New York, NY", website: "https://wilhelmina.com" },
    { ...TEST_ACCOUNTS.agencies[4], bio: "Ford Models. Pioneering the modeling industry since 1946.", location: "New York, NY", website: "https://fordmodels.com" },
    { ...TEST_ACCOUNTS.agencies[5], bio: "Storm Model Management. Discovering and developing exceptional talent.", location: "London, UK", website: "https://stormmodels.com" },
    { ...TEST_ACCOUNTS.agencies[6], bio: "Women Management. Premier model agency in NYC, Paris, Milan.", location: "New York, NY", website: "https://womenmanagement.com" },
    { ...TEST_ACCOUNTS.agencies[7], bio: "Select Model Management. London's leading boutique agency.", location: "London, UK", website: "https://selectmodel.com" },
    { ...TEST_ACCOUNTS.agencies[8], bio: "Marilyn Agency. Representing the finest talent in Paris.", location: "Paris, France", website: "https://marilynagency.com" },
    { ...TEST_ACCOUNTS.agencies[9], bio: "DNA Model Management. Curating unique, diverse beauty.", location: "New York, NY", website: "https://dnamodels.com" },
  ]

  const agencies: string[] = []
  for (const a of agencyData) {
    const user = await prisma.user.create({
      data: {
        email: a.email,
        username: a.username,
        passwordHash: hash,
        displayName: a.name,
        role: Role.AGENCY,
        isDemo: true,
        authProvider: "demo",
        profile: { create: { displayName: a.name, bio: a.bio, location: a.location, verificationStatus: "LUXLANE_VERIFIED", avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(a.name)}&background=0d1b2a&color=00b4d8&size=200&bold=true` } },
        agencyProfile: { create: { agencyName: a.name, website: a.website, verified: true, commissionRate: 20.0 } },
        settings: { create: { darkMode: true } },
      },
    })
    agencies.push(user.id)
    console.log(`  Agency: ${a.name} (${a.email})`)
  }

  // ── MODELS (10) — all independent, no agency assignments ──
  const modelData = [
    { ...TEST_ACCOUNTS.models[0], bio: "International runway model. Paris, Milan, NYC.", location: "Paris, France", heightCm: 180, bustCm: 81, waistCm: 61, hipsCm: 86, hair: "Brunette", eyes: "Green", shoe: "40 EU", score: 94, exp: ["Dior SS24", "Chanel Resort", "Prada FW23"] },
    { ...TEST_ACCOUNTS.models[1], bio: "Shanghai-born, London-based. Editorial and high fashion.", location: "London, UK", heightCm: 178, bustCm: 80, waistCm: 60, hipsCm: 87, hair: "Black", eyes: "Brown", shoe: "39 EU", score: 88, exp: ["Valentino", "Bottega Veneta", "Vogue China Cover"] },
    { ...TEST_ACCOUNTS.models[2], bio: "Aspiring model. NYC based. Open to collaborations.", location: "Brooklyn, NY", heightCm: 175, bustCm: 81, waistCm: 64, hipsCm: 89, hair: "Blonde", eyes: "Blue", shoe: "38 EU", score: 42, exp: [] },
    { ...TEST_ACCOUNTS.models[3], bio: "Scandinavian beauty. Stockholm & Paris.", location: "Stockholm, Sweden", heightCm: 177, bustCm: 83, waistCm: 62, hipsCm: 90, hair: "Blonde", eyes: "Blue", shoe: "39 EU", score: 78, exp: ["H&M Global", "COS Campaign"] },
    { ...TEST_ACCOUNTS.models[4], bio: "Milan Fashion Week regular. Gucci, Prada, Versace.", location: "Milan, Italy", heightCm: 178, bustCm: 84, waistCm: 61, hipsCm: 89, hair: "Black", eyes: "Brown", shoe: "39 EU", score: 87, exp: ["Gucci FW24", "Prada SS24", "Versace Resort"] },
    { ...TEST_ACCOUNTS.models[5], bio: "Parisian chic. Commercial and editorial.", location: "Paris, France", heightCm: 176, bustCm: 82, waistCm: 62, hipsCm: 88, hair: "Auburn", eyes: "Hazel", shoe: "38 EU", score: 72, exp: ["L'Oréal Paris", "Dior Beauty"] },
    { ...TEST_ACCOUNTS.models[6], bio: "Top model. Specializing in haute couture and runway.", location: "Moscow, Russia", heightCm: 182, bustCm: 80, waistCm: 59, hipsCm: 87, hair: "Blonde", eyes: "Blue", shoe: "41 EU", score: 98, exp: ["Chanel Couture", "Louis Vuitton", "Balenciaga"] },
    { ...TEST_ACCOUNTS.models[7], bio: "French model. Runway and beauty.", location: "Lyon, France", heightCm: 179, bustCm: 81, waistCm: 60, hipsCm: 87, hair: "Brown", eyes: "Green", shoe: "39 EU", score: 75, exp: ["YSL", "Celine"] },
    { ...TEST_ACCOUNTS.models[8], bio: "Nigerian-British model. London & Lagos.", location: "London, UK", heightCm: 181, bustCm: 82, waistCm: 60, hipsCm: 88, hair: "Black", eyes: "Brown", shoe: "40 EU", score: 91, exp: ["Burberry AW24", "Alexander McQueen"] },
    { ...TEST_ACCOUNTS.models[9], bio: "Korean-American. Fashion and commercial.", location: "Seoul, South Korea", heightCm: 174, bustCm: 80, waistCm: 61, hipsCm: 86, hair: "Black", eyes: "Brown", shoe: "37 EU", score: 69, exp: ["Samsung", "Gentle Monster"] },
  ]

  const models: string[] = []
  for (const m of modelData) {
    const user = await prisma.user.create({
      data: {
        email: m.email,
        username: m.username,
        passwordHash: hash,
        displayName: m.name,
        role: Role.MODEL,
        isDemo: true,
        authProvider: "demo",
        profile: {
          create: {
            displayName: m.name,
            bio: m.bio,
            location: m.location,
            height: `${m.heightCm} cm`,
            hair: m.hair,
            eyes: m.eyes,
            experience: m.exp.join(", "),
            verificationStatus: m.score > 70 ? "LUXLANE_VERIFIED" : m.score > 40 ? "AGENCY_VERIFIED" : "UNVERIFIED",
            score: m.score,
            avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(m.name)}&background=2d2d3f&color=f8c291&size=200&bold=true`,
          },
        },
        modelProfile: {
          create: {
            heightCm: m.heightCm,
            bustCm: m.bustCm,
            waistCm: m.waistCm,
            hipsCm: m.hipsCm,
            shoeSize: m.shoe,
            hair: m.hair,
            eyes: m.eyes,
            languages: ["English"],
            verificationLevel: m.score > 70 ? "LUXLANE_VERIFIED" : m.score > 40 ? "AGENCY_VERIFIED" : "UNVERIFIED",
            luxlaneScore: m.score,
          },
        },
        settings: { create: { darkMode: true } },
      },
    })
    models.push(user.id)
    console.log(`  Model: ${m.name} (${m.email}) — independent`)
  }

  // ── CLIENTS (10) ──
  const clientData = [
    { ...TEST_ACCOUNTS.clients[0], bio: "Fashion Photographer. Vogue, Harper's Bazaar, Elle.", location: "Los Angeles, CA", industry: "Photography" },
    { ...TEST_ACCOUNTS.clients[1], bio: "Legendary fashion photographer. 40+ years in the industry.", location: "New York, NY", industry: "Photography" },
    { ...TEST_ACCOUNTS.clients[2], bio: "Creative Director. Brand campaigns and editorial production.", location: "London, UK", industry: "Creative Direction" },
    { ...TEST_ACCOUNTS.clients[3], bio: "Fashion designer and creative visionary.", location: "New York, NY", industry: "Fashion Design" },
    { ...TEST_ACCOUNTS.clients[4], bio: "Stylist and creative consultant. Editorial and commercial.", location: "London, UK", industry: "Styling" },
    { ...TEST_ACCOUNTS.clients[5], bio: "Production manager. Fashion shows and photoshoots.", location: "Paris, France", industry: "Production" },
    { ...TEST_ACCOUNTS.clients[6], bio: "Casting director. 15 years in fashion casting.", location: "New York, NY", industry: "Casting" },
    { ...TEST_ACCOUNTS.clients[7], bio: "Film director and commercial producer.", location: "Seoul, South Korea", industry: "Film & Video" },
    { ...TEST_ACCOUNTS.clients[8], bio: "Beauty and wellness brand founder.", location: "Miami, FL", industry: "Beauty" },
    { ...TEST_ACCOUNTS.clients[9], bio: "Music video and concert tour production.", location: "London, UK", industry: "Entertainment" },
  ]

  const clients: string[] = []
  for (const c of clientData) {
    const user = await prisma.user.create({
      data: {
        email: c.email,
        username: c.username,
        passwordHash: hash,
        displayName: c.name,
        role: Role.CLIENT,
        isDemo: true,
        authProvider: "demo",
        profile: { create: { displayName: c.name, bio: c.bio, location: c.location, verificationStatus: "AGENCY_VERIFIED", avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(c.name)}&background=1b1b2f&color=a29bfe&size=200&bold=true` } },
        clientProfile: { create: { clientName: c.name, industry: c.industry } },
        settings: { create: { darkMode: true } },
      },
    })
    clients.push(user.id)
    console.log(`  Client: ${c.name} (${c.email})`)
  }

  // ── FOLLOW RELATIONSHIPS ──
  console.log("Creating follow relationships...")
  const followPairs: [string, string][] = [
    // Brands follow each other
    [brands[0], brands[1]], [brands[1], brands[0]], [brands[2], brands[0]],
    // Agencies follow brands
    [agencies[0], brands[0]], [agencies[0], brands[1]], [agencies[1], brands[0]],
    [agencies[2], brands[1]], [agencies[3], brands[2]], [agencies[4], brands[3]],
    // Models follow brands
    [models[0], brands[0]], [models[0], brands[1]], [models[1], brands[0]],
    [models[2], brands[1]], [models[3], brands[2]], [models[4], brands[0]],
    [models[4], brands[1]], [models[5], brands[2]], [models[6], brands[0]],
    // Models follow agencies
    [models[0], agencies[0]], [models[1], agencies[1]], [models[2], agencies[2]],
    [models[3], agencies[0]], [models[4], agencies[1]], [models[5], agencies[2]],
    // Models follow each other
    [models[0], models[1]], [models[1], models[0]], [models[2], models[0]],
    [models[3], models[4]], [models[4], models[3]], [models[5], models[6]],
    [models[6], models[7]], [models[7], models[8]], [models[8], models[9]],
    // Brands follow models
    [brands[0], models[0]], [brands[0], models[4]], [brands[0], models[6]],
    [brands[1], models[0]], [brands[1], models[1]], [brands[1], models[4]],
    [brands[2], models[6]], [brands[2], models[8]],
    // Clients follow models and brands
    [clients[0], models[0]], [clients[0], brands[0]], [clients[1], models[6]],
  ]
  for (const [a, b] of followPairs) {
    await prisma.follow.create({ data: { followerId: a, followingId: b } }).catch(() => {})
  }

  // ── CASTINGS (8) ──
  console.log("Creating castings...")
  const now = new Date()
  const futureDate = (days: number) => new Date(now.getTime() + days * 86400000)

  const castingDefs = [
    { createdBy: brands[0], title: "Dior Spring 2025 Campaign", type: "CAMPAIGN" as const, desc: "Seeking diverse female models for our upcoming Spring 2025 campaign. Shot by Steven Meisel in Paris.", location: "Paris, France", payMin: 15000, payMax: 15000, start: futureDate(30), end: futureDate(35), deadline: futureDate(20), minH: 175, maxH: 185, tags: ["runway", "editorial"] },
    { createdBy: brands[1], title: "Gucci Milan Fashion Week", type: "RUNWAY" as const, desc: "Gucci runway show for Milan Fashion Week. Strong walk required.", location: "Milan, Italy", payMin: 5000, payMax: 5000, start: futureDate(40), end: futureDate(41), deadline: futureDate(30), minH: 175, maxH: 185, tags: ["runway"] },
    { createdBy: brands[2], title: "Chanel Haute Couture Fitting", type: "EVENT" as const, desc: "Fitting session for Chanel Haute Couture collection. Paris atelier.", location: "Paris, France", payMin: 800, payMax: 800, start: futureDate(15), end: futureDate(16), deadline: futureDate(10), minH: 172, maxH: 182, tags: ["couture", "fitting"] },
    { createdBy: brands[3], title: "Prada Resort Lookbook", type: "EDITORIAL" as const, desc: "Prada Resort collection lookbook shoot in Sardinia.", location: "Sardinia, Italy", payMin: 8000, payMax: 8000, start: futureDate(45), end: futureDate(48), deadline: futureDate(35), minH: 174, maxH: 184, tags: ["editorial", "campaign"] },
    { createdBy: agencies[0], title: "Elite New Faces 2025", type: "EVENT" as const, desc: "Annual scouting event. Open to all aspiring models.", location: "New York, NY", payMin: 0, payMax: 0, start: futureDate(60), end: futureDate(61), deadline: futureDate(50), minH: 165, maxH: 190, tags: ["scouting", "open-call"] },
    { createdBy: agencies[1], title: "Next x Zara Campaign", type: "CAMPAIGN" as const, desc: "Next Models casting for Zara global campaign in Barcelona.", location: "Barcelona, Spain", payMin: 8000, payMax: 8000, start: futureDate(25), end: futureDate(29), deadline: futureDate(18), minH: 170, maxH: 185, tags: ["commercial", "campaign"] },
    { createdBy: agencies[2], title: "IMG Worldwide Scouting", type: "EVENT" as const, desc: "IMG Models worldwide talent scouting. Virtual submissions accepted.", location: "Worldwide (Virtual)", payMin: 0, payMax: 0, start: futureDate(30), end: futureDate(60), deadline: futureDate(55), minH: 160, maxH: 195, tags: ["scouting"] },
    { createdBy: brands[4], title: "Burberry Autumn Campaign", type: "CAMPAIGN" as const, desc: "Burberry looking for fresh faces for autumn campaign. London shoot.", location: "London, UK", payMin: 10000, payMax: 10000, start: futureDate(50), end: futureDate(53), deadline: futureDate(40), minH: 175, maxH: 185, tags: ["campaign", "editorial"] },
  ]

  const castings: string[] = []
  for (const c of castingDefs) {
    const casting = await prisma.casting.create({
      data: {
        createdBy: c.createdBy,
        title: c.title,
        type: c.type,
        description: c.desc,
        location: c.location,
        payMin: c.payMin,
        payMax: c.payMax,
        startDate: c.start,
        endDate: c.end,
        deadline: c.deadline,
        status: "ACTIVE",
        verifiedOnly: c.payMin > 5000,
        requirements: {
          create: { minHeightCm: c.minH, maxHeightCm: c.maxH, tags: c.tags },
        },
      },
    })
    castings.push(casting.id)
    console.log(`  Casting: ${c.title}`)
  }

  // No pre-made submissions — all applications are user-generated

  // ── POSTS ──
  console.log("Creating posts...")
  await prisma.post.create({
    data: { userId: brands[0], imageUrl: "/placeholder.svg?height=600&width=400&text=Dior+SS25", caption: "Introducing our Spring 2025 collection. Now casting." },
  })
  await prisma.post.create({
    data: { userId: agencies[0], imageUrl: "/placeholder.svg?height=600&width=400&text=Elite+New+Faces", caption: "Applications for Elite New Faces 2025 are now open! Link in bio." },
  })
  await prisma.post.create({
    data: { userId: brands[1], imageUrl: "/placeholder.svg?height=600&width=400&text=Gucci+MFW", caption: "Milan Fashion Week is calling. Are you ready?" },
  })

  console.log("\n✅ Seed complete!")
  console.log(`   ${brands.length} brands, ${agencies.length} agencies, ${models.length} models, ${clients.length} clients`)
  console.log(`   ${castings.length} castings, 0 submissions, 3 posts`)
  console.log(`   All models are independent — no agency assignments`)
  console.log(`\n   Login: any email above + password "${TEST_PASSWORD}"`)
  console.log(`   Example: sofia@luxlane.demo / ${TEST_PASSWORD}`)
}

main()
  .catch((e) => {
    console.error("Seed failed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma?.$disconnect()
  })

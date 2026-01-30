import dotenv from "dotenv"
import path from "path"

// Load .env and .env.local FIRST so DATABASE_URL is set before Prisma is used (Prisma CLI skips env when prisma.config.ts exists)
const root = process.cwd()
dotenv.config({ path: path.join(root, ".env") })
dotenv.config({ path: path.join(root, ".env.local") })

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set. Create a .env or .env.local file with DATABASE_URL=...")
  process.exit(1)
}

import { PrismaClient, Role } from "@prisma/client"
import bcrypt from "bcryptjs"
import { TEST_PASSWORD } from "../lib/test-credentials"

let prisma: PrismaClient

/**
 * Test accounts – password for ALL: see lib/test-credentials.ts (TEST_PASSWORD)
 * Emails: dior@luxlane.demo, elite@luxlane.demo, sofia@luxlane.demo, etc.
 */

async function main() {
  prisma = new PrismaClient()

  // Clear existing data so seed is idempotent (safe to run multiple times)
  await prisma.postLike.deleteMany()
  await prisma.postSave.deleteMany()
  await prisma.comment.deleteMany()
  await prisma.post.deleteMany()
  await prisma.message.deleteMany()
  await prisma.conversationMember.deleteMany()
  await prisma.conversation.deleteMany()
  await prisma.notification.deleteMany()
  await prisma.savedCasting.deleteMany()
  await prisma.submission.deleteMany()
  await prisma.castingRequirement.deleteMany()
  await prisma.casting.deleteMany()
  await prisma.mediaAsset.deleteMany()
  await prisma.follow.deleteMany()
  await prisma.refreshToken.deleteMany()
  await prisma.userSettings.deleteMany()
  await prisma.digitalTwin.deleteMany()
  await prisma.modelProfile.deleteMany()
  await prisma.agencyProfile.deleteMany()
  await prisma.brandProfile.deleteMany()
  await prisma.profile.deleteMany()
  await prisma.user.deleteMany()

  const hash = await bcrypt.hash(TEST_PASSWORD, 12)

  // 1 Brand
  const brandUser = await prisma.user.create({
    data: {
      email: "dior@luxlane.demo",
      username: "dior",
      passwordHash: hash,
      role: Role.BRAND,
    },
  })
  await prisma.profile.create({
    data: {
      userId: brandUser.id,
      displayName: "Dior",
      bio: "French luxury fashion house",
      location: "Paris, France",
    },
  })
  await prisma.brandProfile.create({
    data: {
      userId: brandUser.id,
      brandName: "Dior",
      website: "https://dior.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: brandUser.id },
  })

  // 1 Agency
  const agencyUser = await prisma.user.create({
    data: {
      email: "elite@luxlane.demo",
      username: "eliteagency",
      passwordHash: hash,
      role: Role.AGENCY,
    },
  })
  await prisma.profile.create({
    data: {
      userId: agencyUser.id,
      displayName: "Elite Models Agency",
      bio: "Top talent representation",
      location: "New York, NY",
    },
  })
  await prisma.agencyProfile.create({
    data: {
      userId: agencyUser.id,
      agencyName: "Elite Models Agency",
      website: "https://eliteagency.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: agencyUser.id },
  })

  // Second brand: Gucci
  const gucciUser = await prisma.user.create({
    data: {
      email: "gucci@luxlane.demo",
      username: "gucci",
      passwordHash: hash,
      role: Role.BRAND,
    },
  })
  await prisma.profile.create({
    data: {
      userId: gucciUser.id,
      displayName: "Gucci",
      bio: "Italian luxury fashion house",
      location: "Florence, Italy",
      avatarUrl: "/gucci-luxury-fashion-brand-logo-minimal.jpg",
    },
  })
  await prisma.brandProfile.create({
    data: {
      userId: gucciUser.id,
      brandName: "Gucci",
      website: "https://gucci.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: gucciUser.id },
  })

  // Second agency
  const nextAgencyUser = await prisma.user.create({
    data: {
      email: "next@luxlane.demo",
      username: "nextagency",
      passwordHash: hash,
      role: Role.AGENCY,
    },
  })
  await prisma.profile.create({
    data: {
      userId: nextAgencyUser.id,
      displayName: "Next Management",
      bio: "Global talent agency",
      location: "London, UK",
    },
  })
  await prisma.agencyProfile.create({
    data: {
      userId: nextAgencyUser.id,
      agencyName: "Next Management",
      website: "https://nextmanagement.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: nextAgencyUser.id },
  })

  // Third brand: Chanel
  const chanelUser = await prisma.user.create({
    data: {
      email: "chanel@luxlane.demo",
      username: "chanel",
      passwordHash: hash,
      role: Role.BRAND,
    },
  })
  await prisma.profile.create({
    data: {
      userId: chanelUser.id,
      displayName: "Chanel",
      bio: "French luxury house. Timeless elegance.",
      location: "Paris, France",
      avatarUrl: "/dior-luxury-fashion-brand-logo-minimal.jpg",
    },
  })
  await prisma.brandProfile.create({
    data: {
      userId: chanelUser.id,
      brandName: "Chanel",
      website: "https://chanel.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: chanelUser.id },
  })

  // Third agency
  const imgAgencyUser = await prisma.user.create({
    data: {
      email: "img@luxlane.demo",
      username: "imgmodels",
      passwordHash: hash,
      role: Role.AGENCY,
    },
  })
  await prisma.profile.create({
    data: {
      userId: imgAgencyUser.id,
      displayName: "IMG Models",
      bio: "Worldwide talent and fashion",
      location: "New York, NY",
    },
  })
  await prisma.agencyProfile.create({
    data: {
      userId: imgAgencyUser.id,
      agencyName: "IMG Models",
      website: "https://imgmodels.com",
      verified: true,
    },
  })
  await prisma.userSettings.create({
    data: { userId: imgAgencyUser.id },
  })

  // Models with different profiles and scores (30 total for model section / scoreboard)
  const models = [
    { username: "sofia", displayName: "Sofia M.", bio: "Editorial & runway", location: "Milan", height: "178", hair: "Brunette", eyes: "Brown", experience: "Editorial, Runway", score: 92, avatar: "/elegant-fashion-model-portrait-sofia.jpg" },
    { username: "lina", displayName: "Lina K.", bio: "High fashion", location: "Paris", height: "180", hair: "Blonde", eyes: "Blue", experience: "Campaign, Editorial", score: 88, avatar: "/professional-model-headshot-woman-brunette.jpg" },
    { username: "maya", displayName: "Maya S.", bio: "Luxury campaigns", location: "London", height: "176", hair: "Black", eyes: "Dark Brown", experience: "Campaign", score: 85, avatar: "/high-fashion-editorial-model.jpg" },
    { username: "emma", displayName: "Emma L.", bio: "New face", location: "Berlin", height: "177", hair: "Red", eyes: "Green", experience: "Editorial", score: 78, avatar: "/young-model-headshot-woman-blonde-natural.jpg" },
    { username: "chiara", displayName: "Chiara R.", bio: "Couture specialist", location: "Rome", height: "179", hair: "Brown", eyes: "Hazel", experience: "Runway, Editorial", score: 90, avatar: "/professional-model-headshot-woman-italian-dark-hai.jpg" },
    { username: "zoe", displayName: "Zoe T.", bio: "Commercial & fashion", location: "Los Angeles", height: "175", hair: "Blonde", eyes: "Blue", experience: "Campaign, Commercial", score: 82, avatar: "/model-headshot-blonde-european.jpg" },
    { username: "anna", displayName: "Anna B.", bio: "Editorial & beauty", location: "Copenhagen", height: "177", hair: "Blonde", eyes: "Blue", experience: "Editorial, Beauty", score: 86, avatar: "/young-aspiring-model-portrait-natural.jpg" },
    { username: "lea", displayName: "Léa M.", bio: "Paris runway", location: "Paris", height: "179", hair: "Brown", eyes: "Brown", experience: "Runway, Campaign", score: 89, avatar: "/italian-supermodel-portrait-elegant.jpg" },
    { username: "nina", displayName: "Nina K.", bio: "New face Berlin", location: "Berlin", height: "176", hair: "Black", eyes: "Dark Brown", experience: "Editorial", score: 75, avatar: "/professional-model-headshot-woman-brunette.jpg" },
    { username: "jade", displayName: "Jade W.", bio: "Commercial & editorial", location: "Sydney", height: "175", hair: "Black", eyes: "Brown", experience: "Campaign, Editorial", score: 84, avatar: "/luxury-brand-campaign-model.jpg" },
    { username: "luna", displayName: "Luna V.", bio: "High fashion new face", location: "Madrid", height: "178", hair: "Dark Brown", eyes: "Green", experience: "Editorial, Runway", score: 81, avatar: "/model-casting-event.jpg" },
    { username: "sasha", displayName: "Sasha P.", bio: "Beauty & fashion", location: "Moscow", height: "177", hair: "Blonde", eyes: "Blue", experience: "Beauty, Campaign", score: 87, avatar: "/high-fashion-editorial-photo.jpg" },
    { username: "isla", displayName: "Isla F.", bio: "Editorial & runway", location: "London", height: "177", hair: "Blonde", eyes: "Green", experience: "Runway, Editorial", score: 83, avatar: "/runway-fashion-week-model.jpg" },
    { username: "freya", displayName: "Freya H.", bio: "Luxury & beauty", location: "Oslo", height: "176", hair: "Red", eyes: "Blue", experience: "Campaign, Beauty", score: 80, avatar: "/vogue-editorial-renaissance.jpg" },
    { username: "olivia", displayName: "Olivia C.", bio: "New face", location: "Dublin", height: "175", hair: "Brown", eyes: "Brown", experience: "Editorial", score: 74, avatar: "/young-aspiring-model-portrait-natural.jpg" },
    { username: "mia", displayName: "Mia R.", bio: "Commercial & runway", location: "Barcelona", height: "178", hair: "Dark Brown", eyes: "Hazel", experience: "Campaign, Runway", score: 86, avatar: "/luxury-brand-campaign-photo.jpg" },
    { username: "elena", displayName: "Elena D.", bio: "High fashion", location: "Athens", height: "179", hair: "Black", eyes: "Brown", experience: "Editorial, Runway", score: 88, avatar: "/high-fashion-editorial-model.jpg" },
    { username: "camila", displayName: "Camila S.", bio: "Campaign & editorial", location: "São Paulo", height: "176", hair: "Brunette", eyes: "Brown", experience: "Campaign, Editorial", score: 85, avatar: "/elegant-fashion-model-portrait-sofia.jpg" },
    { username: "valentina", displayName: "Valentina G.", bio: "Couture & runway", location: "Milan", height: "180", hair: "Brown", eyes: "Green", experience: "Runway, Campaign", score: 91, avatar: "/paris-fashion-week-runway-model-walking-couture.jpg" },
    { username: "beatrice", displayName: "Beatrice L.", bio: "Editorial & beauty", location: "Florence", height: "177", hair: "Brunette", eyes: "Brown", experience: "Editorial, Beauty", score: 84, avatar: "/professional-model-headshot-woman-italian-dark-hai.jpg" },
    { username: "giulia", displayName: "Giulia B.", bio: "Runway specialist", location: "Rome", height: "178", hair: "Black", eyes: "Dark Brown", experience: "Runway", score: 82, avatar: "/italian-supermodel-portrait-elegant.jpg" },
    { username: "amelia", displayName: "Amelia W.", bio: "New face London", location: "London", height: "175", hair: "Blonde", eyes: "Blue", experience: "Editorial", score: 76, avatar: "/model-headshot-blonde-european.jpg" },
    { username: "violet", displayName: "Violet K.", bio: "Beauty & campaign", location: "Melbourne", height: "176", hair: "Auburn", eyes: "Green", experience: "Beauty, Campaign", score: 79, avatar: "/luxury-brand-campaign-model.jpg" },
    { username: "iris", displayName: "Iris M.", bio: "High fashion editorial", location: "Amsterdam", height: "178", hair: "Blonde", eyes: "Blue", experience: "Editorial, Runway", score: 87, avatar: "/editorial-fashion-photography-black-and-white.jpg" },
    { username: "noor", displayName: "Noor A.", bio: "Campaign & runway", location: "Dubai", height: "177", hair: "Black", eyes: "Brown", experience: "Campaign, Runway", score: 83, avatar: "/high-fashion-editorial-photo.jpg" },
    { username: "yuki", displayName: "Yuki T.", bio: "Editorial & commercial", location: "Tokyo", height: "174", hair: "Black", eyes: "Dark Brown", experience: "Editorial, Commercial", score: 81, avatar: "/young-model-headshot-woman-blonde-natural.jpg" },
    { username: "alexa", displayName: "Alexa P.", bio: "Runway & campaign", location: "New York", height: "179", hair: "Brown", eyes: "Hazel", experience: "Runway, Campaign", score: 89, avatar: "/runway-fashion-week-photo.jpg" },
    { username: "gemma", displayName: "Gemma N.", bio: "New face", location: "Manchester", height: "176", hair: "Blonde", eyes: "Blue", experience: "Editorial", score: 73, avatar: "/model-casting-event.jpg" },
    { username: "helen", displayName: "Helen V.", bio: "Luxury campaigns", location: "Vienna", height: "178", hair: "Blonde", eyes: "Green", experience: "Campaign, Editorial", score: 86, avatar: "/professional-model-headshot-woman-brunette.jpg" },
    { username: "diana", displayName: "Diana R.", bio: "Editorial & runway", location: "Warsaw", height: "177", hair: "Brunette", eyes: "Blue", experience: "Editorial, Runway", score: 85, avatar: "/dior-spring-2024-collection-campaign-elegant.jpg" },
  ]

  const createdModels: { id: string; username: string }[] = []

  for (const m of models) {
    const user = await prisma.user.create({
      data: {
        email: `${m.username}@luxlane.demo`,
        username: m.username,
        passwordHash: hash,
        role: Role.MODEL,
      },
    })
    await prisma.profile.create({
      data: {
        userId: user.id,
        displayName: m.displayName,
        bio: m.bio,
        location: m.location,
        height: m.height,
        hair: m.hair,
        eyes: m.eyes,
        experience: m.experience,
        score: m.score,
        avatarUrl: m.avatar,
        verificationStatus: m.score >= 88 ? "LUXLANE_VERIFIED" : m.score >= 82 ? "AGENCY_VERIFIED" : "UNVERIFIED",
      },
    })
    await prisma.modelProfile.create({
      data: {
        userId: user.id,
        heightCm: parseInt(m.height, 10),
        bustCm: 84 + (m.username.length % 5),
        waistCm: 62 + (m.username.length % 4),
        hipsCm: 88 + (m.username.length % 6),
        shoeSize: "EU 38",
        hair: m.hair,
        eyes: m.eyes,
        languages: ["English", m.username === "chiara" || m.username === "lea" ? "French" : "Italian"].filter(Boolean).slice(0, 2),
        availability: "AVAILABLE",
        luxlaneScore: m.score,
        details: {
          dressSize: "S",
          skinTone: "light",
          experience: m.experience.split(", "),
        },
      },
    })
    await prisma.userSettings.create({
      data: { userId: user.id },
    })
    createdModels.push({ id: user.id, username: m.username })
  }

  const byUsername = Object.fromEntries(createdModels.map((m) => [m.username, m]))
  const sofia = byUsername.sofia!
  const lina = byUsername.lina!
  const maya = byUsername.maya!
  const emma = byUsername.emma!
  const chiara = byUsername.chiara!
  const zoe = byUsername.zoe!
  const anna = byUsername.anna!
  const lea = byUsername.lea!
  const nina = byUsername.nina!
  const jade = byUsername.jade!
  const luna = byUsername.luna!
  const sasha = byUsername.sasha!
  const isla = byUsername.isla!
  const freya = byUsername.freya!
  const olivia = byUsername.olivia!
  const mia = byUsername.mia!
  const elena = byUsername.elena!
  const camila = byUsername.camila!
  const valentina = byUsername.valentina!
  const beatrice = byUsername.beatrice!
  const giulia = byUsername.giulia!
  const amelia = byUsername.amelia!
  const violet = byUsername.violet!
  const iris = byUsername.iris!
  const noor = byUsername.noor!
  const yuki = byUsername.yuki!
  const alexa = byUsername.alexa!
  const gemma = byUsername.gemma!
  const helen = byUsername.helen!
  const diana = byUsername.diana!

  // Assign models to agencies (roster) – spread across Elite, Next, IMG
  await prisma.modelProfile.updateMany({
    where: { userId: { in: [sofia.id, lina.id, maya.id, emma.id, chiara.id, zoe.id, isla.id, freya.id, olivia.id, alexa.id] } },
    data: { agencyId: agencyUser.id },
  })
  await prisma.modelProfile.updateMany({
    where: { userId: { in: [lea.id, anna.id, nina.id, mia.id, elena.id, camila.id, beatrice.id, amelia.id] } },
    data: { agencyId: nextAgencyUser.id },
  })
  await prisma.modelProfile.updateMany({
    where: { userId: { in: [jade.id, luna.id, sasha.id, valentina.id, giulia.id, violet.id, iris.id, noor.id, yuki.id, gemma.id, helen.id, diana.id] } },
    data: { agencyId: imgAgencyUser.id },
  })

  // Follows: brands, agencies, models – so profile follower counts and discovery feel real
  await prisma.follow.createMany({
    data: [
      { followerId: brandUser.id, followingId: sofia.id },
      { followerId: brandUser.id, followingId: lina.id },
      { followerId: brandUser.id, followingId: chiara.id },
      { followerId: brandUser.id, followingId: valentina.id },
      { followerId: gucciUser.id, followingId: sofia.id },
      { followerId: gucciUser.id, followingId: lea.id },
      { followerId: gucciUser.id, followingId: lina.id },
      { followerId: gucciUser.id, followingId: alexa.id },
      { followerId: chanelUser.id, followingId: sasha.id },
      { followerId: chanelUser.id, followingId: jade.id },
      { followerId: chanelUser.id, followingId: iris.id },
      { followerId: agencyUser.id, followingId: sofia.id },
      { followerId: agencyUser.id, followingId: lina.id },
      { followerId: agencyUser.id, followingId: maya.id },
      { followerId: agencyUser.id, followingId: emma.id },
      { followerId: agencyUser.id, followingId: chiara.id },
      { followerId: agencyUser.id, followingId: zoe.id },
      { followerId: agencyUser.id, followingId: isla.id },
      { followerId: nextAgencyUser.id, followingId: lea.id },
      { followerId: nextAgencyUser.id, followingId: anna.id },
      { followerId: nextAgencyUser.id, followingId: maya.id },
      { followerId: nextAgencyUser.id, followingId: mia.id },
      { followerId: imgAgencyUser.id, followingId: jade.id },
      { followerId: imgAgencyUser.id, followingId: luna.id },
      { followerId: imgAgencyUser.id, followingId: sasha.id },
      { followerId: imgAgencyUser.id, followingId: valentina.id },
      { followerId: lina.id, followingId: sofia.id },
      { followerId: maya.id, followingId: sofia.id },
      { followerId: emma.id, followingId: lina.id },
      { followerId: zoe.id, followingId: chiara.id },
      { followerId: anna.id, followingId: sofia.id },
      { followerId: lea.id, followingId: lina.id },
      { followerId: nina.id, followingId: emma.id },
      { followerId: jade.id, followingId: sofia.id },
      { followerId: jade.id, followingId: lina.id },
      { followerId: luna.id, followingId: emma.id },
      { followerId: sasha.id, followingId: chiara.id },
      { followerId: sasha.id, followingId: anna.id },
      { followerId: isla.id, followingId: sofia.id },
      { followerId: valentina.id, followingId: chiara.id },
      { followerId: alexa.id, followingId: lea.id },
    ],
    skipDuplicates: true,
  })

  // Portfolio media – multiple images per model so profiles look full
  const portfolioEntries: { ownerId: string; type: "PORTFOLIO"; url: string }[] = [
    { ownerId: sofia.id, type: "PORTFOLIO", url: "/high-fashion-editorial-model.jpg" },
    { ownerId: sofia.id, type: "PORTFOLIO", url: "/runway-fashion-week-model.jpg" },
    { ownerId: sofia.id, type: "PORTFOLIO", url: "/elegant-fashion-model-portrait-sofia.jpg" },
    { ownerId: sofia.id, type: "PORTFOLIO", url: "/dior-haute-couture-dress-detail.jpg" },
    { ownerId: lina.id, type: "PORTFOLIO", url: "/professional-model-headshot-woman-brunette.jpg" },
    { ownerId: lina.id, type: "PORTFOLIO", url: "/editorial-fashion-photography-black-and-white.jpg" },
    { ownerId: lina.id, type: "PORTFOLIO", url: "/runway-fashion-week-model.jpg" },
    { ownerId: chiara.id, type: "PORTFOLIO", url: "/elegant-fashion-model-portrait-sofia.jpg" },
    { ownerId: chiara.id, type: "PORTFOLIO", url: "/paris-fashion-week-runway-model-walking-couture.jpg" },
    { ownerId: lea.id, type: "PORTFOLIO", url: "/paris-fashion-week-runway-model-walking-couture.jpg" },
    { ownerId: lea.id, type: "PORTFOLIO", url: "/italian-supermodel-portrait-elegant.jpg" },
    { ownerId: jade.id, type: "PORTFOLIO", url: "/luxury-brand-campaign-model.jpg" },
    { ownerId: jade.id, type: "PORTFOLIO", url: "/luxury-brand-campaign-photo.jpg" },
    { ownerId: luna.id, type: "PORTFOLIO", url: "/model-casting-event.jpg" },
    { ownerId: sasha.id, type: "PORTFOLIO", url: "/high-fashion-editorial-photo.jpg" },
    { ownerId: sasha.id, type: "PORTFOLIO", url: "/vogue-editorial-renaissance.jpg" },
    { ownerId: maya.id, type: "PORTFOLIO", url: "/high-fashion-editorial-model.jpg" },
    { ownerId: emma.id, type: "PORTFOLIO", url: "/young-model-headshot-woman-blonde-natural.jpg" },
    { ownerId: anna.id, type: "PORTFOLIO", url: "/vogue-editorial-renaissance.jpg" },
    { ownerId: nina.id, type: "PORTFOLIO", url: "/professional-model-headshot-woman-brunette.jpg" },
    { ownerId: zoe.id, type: "PORTFOLIO", url: "/model-headshot-blonde-european.jpg" },
    { ownerId: isla.id, type: "PORTFOLIO", url: "/runway-fashion-week-model.jpg" },
    { ownerId: freya.id, type: "PORTFOLIO", url: "/vogue-editorial-renaissance.jpg" },
    { ownerId: olivia.id, type: "PORTFOLIO", url: "/young-aspiring-model-portrait-natural.jpg" },
    { ownerId: mia.id, type: "PORTFOLIO", url: "/luxury-brand-campaign-photo.jpg" },
    { ownerId: elena.id, type: "PORTFOLIO", url: "/high-fashion-editorial-model.jpg" },
    { ownerId: camila.id, type: "PORTFOLIO", url: "/elegant-fashion-model-portrait-sofia.jpg" },
    { ownerId: valentina.id, type: "PORTFOLIO", url: "/paris-fashion-week-runway-model-walking-couture.jpg" },
    { ownerId: beatrice.id, type: "PORTFOLIO", url: "/professional-model-headshot-woman-italian-dark-hai.jpg" },
    { ownerId: giulia.id, type: "PORTFOLIO", url: "/italian-supermodel-portrait-elegant.jpg" },
    { ownerId: amelia.id, type: "PORTFOLIO", url: "/model-headshot-blonde-european.jpg" },
    { ownerId: violet.id, type: "PORTFOLIO", url: "/luxury-brand-campaign-model.jpg" },
    { ownerId: iris.id, type: "PORTFOLIO", url: "/editorial-fashion-photography-black-and-white.jpg" },
    { ownerId: noor.id, type: "PORTFOLIO", url: "/high-fashion-editorial-photo.jpg" },
    { ownerId: yuki.id, type: "PORTFOLIO", url: "/young-model-headshot-woman-blonde-natural.jpg" },
    { ownerId: alexa.id, type: "PORTFOLIO", url: "/runway-fashion-week-photo.jpg" },
    { ownerId: gemma.id, type: "PORTFOLIO", url: "/model-casting-event.jpg" },
    { ownerId: helen.id, type: "PORTFOLIO", url: "/professional-model-headshot-woman-brunette.jpg" },
    { ownerId: diana.id, type: "PORTFOLIO", url: "/dior-spring-2024-collection-campaign-elegant.jpg" },
  ]
  await prisma.mediaAsset.createMany({ data: portfolioEntries })

  // Castings (active)
  const casting1 = await prisma.casting.create({
    data: {
      createdBy: brandUser.id,
      title: "Dior Spring 2025 Campaign",
      type: "CAMPAIGN",
      description: "Seeking models for the upcoming spring campaign. Editorial experience preferred.",
      location: "Paris, France",
      payMin: 5000,
      payMax: 15000,
      status: "ACTIVE",
      verifiedOnly: true,
      deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.castingRequirement.create({
    data: {
      castingId: casting1.id,
      minHeightCm: 172,
      maxHeightCm: 182,
      tags: ["editorial", "campaign"],
      notes: "Natural beauty, versatile look",
    },
  })

  const casting2 = await prisma.casting.create({
    data: {
      createdBy: gucciUser.id,
      title: "Gucci Runway FW25",
      type: "RUNWAY",
      description: "Milan Fashion Week – Gucci show. Strong runway walk required.",
      location: "Milan, Italy",
      payMin: 3000,
      payMax: 8000,
      status: "ACTIVE",
      verifiedOnly: false,
      deadline: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.castingRequirement.create({
    data: {
      castingId: casting2.id,
      minHeightCm: 175,
      maxHeightCm: 185,
      tags: ["runway", "fashion week"],
    },
  })

  const casting3 = await prisma.casting.create({
    data: {
      createdBy: brandUser.id,
      title: "Dior Haute Couture Fitting",
      type: "EVENT",
      description: "Fitting for haute couture presentation.",
      location: "Paris",
      payMin: 1500,
      payMax: 3000,
      status: "ACTIVE",
      deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  })

  const casting4 = await prisma.casting.create({
    data: {
      createdBy: chanelUser.id,
      title: "Chanel N°5 Beauty Campaign",
      type: "CAMPAIGN",
      description: "Beauty and fragrance campaign. Strong beauty look required.",
      location: "Paris, France",
      payMin: 8000,
      payMax: 20000,
      status: "ACTIVE",
      verifiedOnly: true,
      deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  })
  await prisma.castingRequirement.create({
    data: {
      castingId: casting4.id,
      minHeightCm: 172,
      maxHeightCm: 182,
      tags: ["beauty", "campaign", "fragrance"],
      notes: "Clean skin, versatile beauty",
    },
  })

  // Submissions (models applied; some agency-proposed via submittedBy = agency id later in flow)
  await prisma.submission.createMany({
    data: [
      { castingId: casting1.id, modelId: sofia.id, submittedBy: sofia.id, status: "SHORTLISTED", note: "Very interested!" },
      { castingId: casting1.id, modelId: lina.id, submittedBy: lina.id, status: "APPLIED" },
      { castingId: casting1.id, modelId: chiara.id, submittedBy: chiara.id, status: "APPLIED" },
      { castingId: casting1.id, modelId: jade.id, submittedBy: jade.id, status: "APPLIED" },
      { castingId: casting1.id, modelId: elena.id, submittedBy: elena.id, status: "APPLIED" },
      { castingId: casting1.id, modelId: valentina.id, submittedBy: valentina.id, status: "APPLIED" },
      { castingId: casting2.id, modelId: lea.id, submittedBy: lea.id, status: "APPLIED" },
      { castingId: casting2.id, modelId: sofia.id, submittedBy: sofia.id, status: "APPLIED" },
      { castingId: casting2.id, modelId: luna.id, submittedBy: luna.id, status: "APPLIED" },
      { castingId: casting2.id, modelId: alexa.id, submittedBy: alexa.id, status: "APPLIED" },
      { castingId: casting2.id, modelId: mia.id, submittedBy: mia.id, status: "APPLIED" },
      { castingId: casting3.id, modelId: emma.id, submittedBy: emma.id, status: "APPLIED" },
      { castingId: casting3.id, modelId: beatrice.id, submittedBy: beatrice.id, status: "APPLIED" },
      { castingId: casting4.id, modelId: sasha.id, submittedBy: sasha.id, status: "SHORTLISTED", note: "Beauty specialist" },
      { castingId: casting4.id, modelId: anna.id, submittedBy: anna.id, status: "APPLIED" },
      { castingId: casting4.id, modelId: jade.id, submittedBy: jade.id, status: "APPLIED" },
      { castingId: casting4.id, modelId: iris.id, submittedBy: iris.id, status: "APPLIED" },
      { castingId: casting4.id, modelId: freya.id, submittedBy: freya.id, status: "APPLIED" },
    ],
    skipDuplicates: true,
  })

  // Saved castings
  await prisma.savedCasting.createMany({
    data: [
      { userId: lina.id, castingId: casting1.id },
      { userId: maya.id, castingId: casting1.id },
      { userId: anna.id, castingId: casting2.id },
      { userId: jade.id, castingId: casting4.id },
      { userId: luna.id, castingId: casting2.id },
      { userId: sasha.id, castingId: casting4.id },
    ],
    skipDuplicates: true,
  })

  // Feed posts – models and brands so profiles and feed are full
  const posts = await prisma.post.createManyAndReturn({
    data: [
      { userId: sofia.id, imageUrl: "/high-fashion-editorial-model.jpg", caption: "Behind the scenes from yesterday's shoot. Thank you to the incredible team." },
      { userId: brandUser.id, imageUrl: "/dior-fashion-campaign-spring-aesthetic.jpg", caption: "Spring 2025. A new chapter begins. #DiorSS25" },
      { userId: lina.id, imageUrl: "/runway-fashion-week-model.jpg", caption: "Milan Fashion Week finale walk. Dreams do come true." },
      { userId: gucciUser.id, imageUrl: "/gucci-fashion-show-runway-aesthetic.jpg", caption: "FW25. See you on the runway. #GucciFW25" },
      { userId: chiara.id, imageUrl: "/dior-haute-couture-dress-detail.jpg", caption: "Couture details. Grateful for this journey." },
      { userId: lea.id, imageUrl: "/paris-fashion-week-runway-model-walking-couture.jpg", caption: "Paris. Always magic." },
      { userId: anna.id, imageUrl: "/vogue-editorial-renaissance.jpg", caption: "Editorial out now. Thank you @vogue." },
      { userId: emma.id, imageUrl: "/young-model-headshot-woman-blonde-natural.jpg", caption: "New face life. Learning every day." },
      { userId: jade.id, imageUrl: "/luxury-brand-campaign-model.jpg", caption: "Campaign drop. So grateful for this team." },
      { userId: chanelUser.id, imageUrl: "/dior-luxury-accessories-jewelry.jpg", caption: "Timeless elegance. N°5." },
      { userId: sasha.id, imageUrl: "/high-fashion-editorial-photo.jpg", caption: "Beauty shoot wrap. Thank you everyone." },
      { userId: luna.id, imageUrl: "/model-casting-event.jpg", caption: "Casting day vibes. Fingers crossed." },
      { userId: maya.id, imageUrl: "/high-fashion-editorial-model.jpg", caption: "London calling. New project coming soon." },
      { userId: isla.id, imageUrl: "/runway-fashion-week-model.jpg", caption: "Runway season. So grateful." },
      { userId: freya.id, imageUrl: "/vogue-editorial-renaissance.jpg", caption: "Editorial out. Thank you team." },
      { userId: mia.id, imageUrl: "/luxury-brand-campaign-photo.jpg", caption: "Barcelona shoot. Best crew." },
      { userId: elena.id, imageUrl: "/high-fashion-editorial-model.jpg", caption: "Athens to the world." },
      { userId: valentina.id, imageUrl: "/paris-fashion-week-runway-model-walking-couture.jpg", caption: "Couture week. Dream come true." },
      { userId: iris.id, imageUrl: "/editorial-fashion-photography-black-and-white.jpg", caption: "B&W editorial. Love this one." },
      { userId: alexa.id, imageUrl: "/runway-fashion-week-photo.jpg", caption: "NYFW. What a week." },
      { userId: helen.id, imageUrl: "/professional-model-headshot-woman-brunette.jpg", caption: "New headshots. Vienna." },
      { userId: diana.id, imageUrl: "/dior-spring-2024-collection-campaign-elegant.jpg", caption: "Campaign season. Blessed." },
    ],
  })

  // Post likes (so feed has engagement)
  const postIds = posts.map((p) => p.id)
  if (postIds.length >= 4) {
    await prisma.postLike.createMany({
      data: [
        { userId: lina.id, postId: postIds[0] },
        { userId: maya.id, postId: postIds[0] },
        { userId: chiara.id, postId: postIds[0] },
        { userId: sofia.id, postId: postIds[1] },
        { userId: emma.id, postId: postIds[1] },
        { userId: brandUser.id, postId: postIds[2] },
        { userId: sofia.id, postId: postIds[2] },
        { userId: gucciUser.id, postId: postIds[3] },
        { userId: lea.id, postId: postIds[3] },
        { userId: sasha.id, postId: postIds[8] },
        { userId: luna.id, postId: postIds[8] },
        { userId: anna.id, postId: postIds[9] },
        { userId: jade.id, postId: postIds[10] },
        { userId: chiara.id, postId: postIds[10] },
        { userId: emma.id, postId: postIds[11] },
        { userId: nina.id, postId: postIds[11] },
      ],
      skipDuplicates: true,
    })
  }

  // Comments on posts
  if (postIds.length >= 2) {
    await prisma.comment.createMany({
      data: [
        { postId: postIds[0], userId: lina.id, body: "So good! 🔥" },
        { postId: postIds[0], userId: chiara.id, body: "Stunning as always" },
        { postId: postIds[1], userId: sofia.id, body: "Can't wait for this campaign" },
        { postId: postIds[2], userId: brandUser.id, body: "Amazing work" },
        { postId: postIds[8], userId: sasha.id, body: "Love this!" },
        { postId: postIds[8], userId: luna.id, body: "So good Jade" },
        { postId: postIds[10], userId: anna.id, body: "Beauty goals" },
        { postId: postIds[11], userId: jade.id, body: "Good luck!" },
      ],
      skipDuplicates: false,
    })
  }

  // Direct conversations with messages
  const conv1 = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: brandUser.id },
          { userId: sofia.id },
        ],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      { conversationId: conv1.id, senderId: brandUser.id, body: "Hi Sofia, we'd love to have you for the Spring campaign. Are you available next week?" },
      { conversationId: conv1.id, senderId: sofia.id, body: "Hi! Yes, I'm very interested. I have availability from Monday." },
      { conversationId: conv1.id, senderId: brandUser.id, body: "Perfect. We'll send the brief and call sheet by Friday." },
    ],
  })

  const conv2 = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: lina.id },
          { userId: agencyUser.id },
        ],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      { conversationId: conv2.id, senderId: agencyUser.id, body: "Lina, casting callback for the Dior campaign – tomorrow 3pm?" },
      { conversationId: conv2.id, senderId: lina.id, body: "Yes, I'll be there. Thank you!" },
    ],
  })

  const conv3 = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: sofia.id },
          { userId: lina.id },
        ],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      { conversationId: conv3.id, senderId: sofia.id, body: "Hey! Are you going to the Gucci casting?" },
      { conversationId: conv3.id, senderId: lina.id, body: "Yes! See you there 💪" },
    ],
  })

  const conv4 = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: chanelUser.id },
          { userId: sasha.id },
        ],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      { conversationId: conv4.id, senderId: chanelUser.id, body: "Sasha, we'd like to schedule a callback for the N°5 campaign. Are you free next week?" },
      { conversationId: conv4.id, senderId: sasha.id, body: "Yes! I have Tuesday and Thursday open. Thank you so much." },
    ],
  })

  const conv5 = await prisma.conversation.create({
    data: {
      type: "direct",
      members: {
        create: [
          { userId: imgAgencyUser.id },
          { userId: jade.id },
        ],
      },
    },
  })
  await prisma.message.createMany({
    data: [
      { conversationId: conv5.id, senderId: imgAgencyUser.id, body: "Jade, we have a Dior casting we'd like to put you forward for. Can you send your latest book?" },
      { conversationId: conv5.id, senderId: jade.id, body: "Of course! Sending it over today." },
    ],
  })

  console.log("Seed complete: 3 brands, 3 agencies, 30 models, castings, follows, posts, conversations, submissions, portfolio media.")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    if (prisma) await prisma.$disconnect()
  })

/**
 * In-memory mock Prisma client for running without a database.
 * Seeded with test accounts from test-credentials.ts.
 * Supports findUnique, findFirst, findMany, create, update, upsert, delete, count, updateMany.
 */
import bcrypt from "bcryptjs"
import { v4 as uuidv4 } from "uuid"
import { TEST_PASSWORD, TEST_ACCOUNTS } from "./test-credentials"

// Pre-hash the test password (sync, runs once at module load)
const HASH = bcrypt.hashSync(TEST_PASSWORD, 10)

// ─── Seed Data ──────────────────────────────────────────────────────────────

const brandNames: Record<string, string> = { dior: "Maison Dior", gucci: "Gucci", chanel: "Chanel" }
const agencyNames: Record<string, string> = {
  eliteagency: "Elite Model Management",
  nextagency: "Next Models",
  imgmodels: "IMG Models",
}
const modelNames: Record<string, string> = {
  sofia: "Sofia Laurent",
  lina: "Lina Chen",
  maya: "Maya Williams",
  emma: "Emma Jones",
  chiara: "Chiara Rossi",
  zoe: "Zoe Park",
  anna: "Anna Schmidt",
  lea: "Léa Martin",
  nina: "Nina Petrova",
  jade: "Jade Thompson",
  luna: "Luna Garcia",
  sasha: "Sasha Kim",
}

const seedUsers = [
  ...TEST_ACCOUNTS.brands.map((a, i) => ({
    id: `mock-brand-${i}`,
    email: a.email,
    username: a.username,
    passwordHash: HASH,
    role: "BRAND",
    createdAt: new Date("2022-01-01"),
    updatedAt: new Date(),
  })),
  ...TEST_ACCOUNTS.agencies.map((a, i) => ({
    id: `mock-agency-${i}`,
    email: a.email,
    username: a.username,
    passwordHash: HASH,
    role: "AGENCY",
    createdAt: new Date("2022-01-01"),
    updatedAt: new Date(),
  })),
  ...TEST_ACCOUNTS.models.map((a, i) => ({
    id: `mock-model-${i}`,
    email: a.email,
    username: a.username,
    passwordHash: HASH,
    role: "MODEL",
    createdAt: new Date("2023-01-01"),
    updatedAt: new Date(),
  })),
]

const seedProfiles = seedUsers.map((u) => {
  let displayName = u.username
  if (u.role === "BRAND") displayName = brandNames[u.username] || u.username
  else if (u.role === "AGENCY") displayName = agencyNames[u.username] || u.username
  else if (u.role === "MODEL") displayName = modelNames[u.username] || u.username
  return {
    userId: u.id,
    displayName,
    bio: `${displayName} on LuxLane`,
    location: "Paris, France",
    height: u.role === "MODEL" ? "178 cm" : null,
    hair: u.role === "MODEL" ? "Brown" : null,
    eyes: u.role === "MODEL" ? "Green" : null,
    experience: u.role === "MODEL" ? "3 years" : null,
    verificationStatus: "LUXLANE_VERIFIED",
    score: u.role === "MODEL" ? 80 + Math.floor(Math.random() * 20) : null,
    avatarUrl: null,
    coverUrl: null,
  }
})

const seedModelProfiles = seedUsers
  .filter((u) => u.role === "MODEL")
  .map((u, i) => ({
    userId: u.id,
    heightCm: 175 + (i % 10),
    bustCm: 80 + (i % 5),
    waistCm: 58 + (i % 5),
    hipsCm: 85 + (i % 5),
    shoeSize: 38 + (i % 4),
    hair: ["Brown", "Black", "Blonde", "Red", "Auburn"][i % 5],
    eyes: ["Green", "Brown", "Blue", "Hazel", "Gray"][i % 5],
    languages: ["English", "French"],
    availability: "AVAILABLE",
    agencyId: i < 4 ? "mock-agency-0" : i < 8 ? "mock-agency-1" : "mock-agency-2",
    verificationLevel: "LUXLANE_VERIFIED",
    luxlaneScore: 80 + i * 1.5,
    details: null,
  }))

const seedAgencyProfiles = seedUsers
  .filter((u) => u.role === "AGENCY")
  .map((u) => ({
    userId: u.id,
    agencyName: agencyNames[u.username] || u.username,
    website: `https://${u.username}.com`,
    verified: true,
  }))

const seedBrandProfiles = seedUsers
  .filter((u) => u.role === "BRAND")
  .map((u) => ({
    userId: u.id,
    brandName: brandNames[u.username] || u.username,
    website: `https://${u.username}.com`,
    verified: true,
  }))

const seedCastings = [
  {
    id: "mock-casting-0",
    createdBy: "mock-brand-0",
    title: "Dior Spring 2025 Campaign",
    type: "CAMPAIGN",
    description: "Seeking diverse female models for our upcoming Spring 2025 campaign. Shot by Steven Meisel in Paris.",
    location: "Paris, France",
    startDate: new Date("2025-03-15"),
    endDate: new Date("2025-03-20"),
    payMin: 10000,
    payMax: 25000,
    deadline: new Date("2025-02-28"),
    status: "ACTIVE",
    verifiedOnly: true,
    requireDigitalTwin: false,
    maxSubmissionsPerAgency: 5,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date(),
  },
  {
    id: "mock-casting-1",
    createdBy: "mock-brand-1",
    title: "Gucci Milan Fashion Week FW25",
    type: "RUNWAY",
    description: "Open casting for Gucci FW25 runway show in Milan. Looking for unique, bold faces.",
    location: "Milan, Italy",
    startDate: new Date("2025-02-20"),
    endDate: new Date("2025-02-21"),
    payMin: 3000,
    payMax: 8000,
    deadline: new Date("2025-02-10"),
    status: "ACTIVE",
    verifiedOnly: false,
    requireDigitalTwin: false,
    maxSubmissionsPerAgency: 10,
    createdAt: new Date("2025-01-20"),
    updatedAt: new Date(),
  },
  {
    id: "mock-casting-2",
    createdBy: "mock-brand-2",
    title: "Chanel Haute Couture SS25",
    type: "RUNWAY",
    description: "Exclusive casting for Chanel Haute Couture Spring/Summer 2025 show.",
    location: "Paris, France",
    startDate: new Date("2025-01-25"),
    endDate: new Date("2025-01-26"),
    payMin: 5000,
    payMax: 15000,
    deadline: new Date("2025-01-15"),
    status: "CLOSED",
    verifiedOnly: true,
    requireDigitalTwin: true,
    maxSubmissionsPerAgency: 3,
    createdAt: new Date("2024-12-20"),
    updatedAt: new Date(),
  },
  {
    id: "mock-casting-3",
    createdBy: "mock-brand-0",
    title: "Dior Beauty Campaign",
    type: "CAMPAIGN",
    description: "New faces for Dior Beauty 2025 campaign. Looking for fresh, natural beauty.",
    location: "Los Angeles, CA",
    startDate: new Date("2025-04-01"),
    endDate: new Date("2025-04-05"),
    payMin: 8000,
    payMax: 20000,
    deadline: new Date("2025-03-15"),
    status: "DRAFT",
    verifiedOnly: false,
    requireDigitalTwin: false,
    maxSubmissionsPerAgency: 5,
    createdAt: new Date("2025-02-01"),
    updatedAt: new Date(),
  },
]

const seedCastingRequirements = [
  { castingId: "mock-casting-0", minHeightCm: 175, maxHeightCm: 185, tags: ["runway", "editorial", "high-fashion"], notes: null },
  { castingId: "mock-casting-1", minHeightCm: 178, maxHeightCm: 188, tags: ["runway", "avant-garde"], notes: null },
  { castingId: "mock-casting-2", minHeightCm: 175, maxHeightCm: 185, tags: ["couture", "runway"], notes: "Must have couture experience" },
  { castingId: "mock-casting-3", minHeightCm: 170, maxHeightCm: null, tags: ["beauty", "campaign"], notes: "Natural look preferred" },
]

const seedSubmissions = [
  {
    id: "mock-sub-0",
    castingId: "mock-casting-0",
    modelId: "mock-model-0",
    submittedBy: "mock-model-0",
    status: "SHORTLISTED",
    note: "Excited to work with Dior again.",
    createdAt: new Date("2025-01-16"),
    updatedAt: new Date("2025-01-18"),
  },
  {
    id: "mock-sub-1",
    castingId: "mock-casting-0",
    modelId: "mock-model-1",
    submittedBy: "mock-agency-0",
    status: "APPLIED",
    note: null,
    createdAt: new Date("2025-01-17"),
    updatedAt: new Date("2025-01-17"),
  },
  {
    id: "mock-sub-2",
    castingId: "mock-casting-1",
    modelId: "mock-model-0",
    submittedBy: "mock-model-0",
    status: "OFFERED",
    note: "Would love to walk for Gucci.",
    createdAt: new Date("2025-01-21"),
    updatedAt: new Date("2025-01-25"),
  },
  {
    id: "mock-sub-3",
    castingId: "mock-casting-1",
    modelId: "mock-model-2",
    submittedBy: "mock-model-2",
    status: "APPLIED",
    note: null,
    createdAt: new Date("2025-01-22"),
    updatedAt: new Date("2025-01-22"),
  },
  {
    id: "mock-sub-4",
    castingId: "mock-casting-2",
    modelId: "mock-model-3",
    submittedBy: "mock-agency-0",
    status: "CONFIRMED",
    note: "Confirmed for Chanel show.",
    createdAt: new Date("2024-12-22"),
    updatedAt: new Date("2025-01-10"),
  },
]

const seedPosts = [
  {
    id: "mock-post-0",
    userId: "mock-model-0",
    imageUrl: "/high-fashion-editorial-model.jpg",
    caption: "Behind the scenes from yesterday's Dior shoot. Thank you to the incredible team.",
    createdAt: new Date(Date.now() - 4 * 3600000),
  },
  {
    id: "mock-post-1",
    userId: "mock-brand-0",
    imageUrl: "/dior-fashion-campaign-spring-aesthetic.jpg",
    caption: "Spring 2025. A new chapter begins. #DiorSS25",
    createdAt: new Date(Date.now() - 8 * 3600000),
  },
  {
    id: "mock-post-2",
    userId: "mock-model-4",
    imageUrl: "/runway-fashion-week-model.jpg",
    caption: "Milan Fashion Week finale walk. Dreams do come true.",
    createdAt: new Date(Date.now() - 24 * 3600000),
  },
  {
    id: "mock-post-3",
    userId: "mock-model-0",
    imageUrl: "/luxury-brand-campaign-model.jpg",
    caption: "New campaign dropping soon. Stay tuned.",
    createdAt: new Date(Date.now() - 48 * 3600000),
  },
  {
    id: "mock-post-4",
    userId: "mock-brand-1",
    imageUrl: "/gucci-fashion-show-runway-aesthetic.jpg",
    caption: "Gucci FW25 - Embracing the extraordinary.",
    createdAt: new Date(Date.now() - 72 * 3600000),
  },
]

const seedNotifications = [
  {
    id: "mock-notif-0",
    userId: "mock-model-0",
    type: "OFFER",
    payload: { title: "New Job Offer", body: "Dior has sent you an offer for Spring 2025 Campaign", relatedId: "mock-casting-0", relatedType: "casting" },
    read: false,
    createdAt: new Date("2025-02-01"),
  },
  {
    id: "mock-notif-1",
    userId: "mock-model-0",
    type: "SHORTLISTED",
    payload: { title: "You've been shortlisted!", body: "Congratulations for Dior Spring 2025", relatedId: "mock-casting-0", relatedType: "casting" },
    read: true,
    createdAt: new Date("2025-01-18"),
  },
  {
    id: "mock-notif-2",
    userId: "mock-model-0",
    type: "INVITE",
    payload: { title: "Casting Invitation", body: "Gucci has invited you to apply for Milan Fashion Week", relatedId: "mock-casting-1", relatedType: "casting" },
    read: true,
    createdAt: new Date("2025-01-20"),
  },
]

const seedConversations = [
  { id: "mock-conv-0", type: "direct", castingId: null, createdAt: new Date("2025-01-15") },
  { id: "mock-conv-1", type: "direct", castingId: null, createdAt: new Date("2025-01-20") },
]

const seedConversationMembers = [
  { conversationId: "mock-conv-0", userId: "mock-model-0", joinedAt: new Date("2025-01-15") },
  { conversationId: "mock-conv-0", userId: "mock-brand-0", joinedAt: new Date("2025-01-15") },
  { conversationId: "mock-conv-1", userId: "mock-model-0", joinedAt: new Date("2025-01-20") },
  { conversationId: "mock-conv-1", userId: "mock-agency-0", joinedAt: new Date("2025-01-20") },
]

const seedMessages = [
  {
    id: "mock-msg-0",
    conversationId: "mock-conv-0",
    senderId: "mock-brand-0",
    body: "We loved your portfolio! Would you be interested in our Spring 2025 campaign?",
    attachmentUrl: null,
    createdAt: new Date("2025-01-15T10:00:00"),
  },
  {
    id: "mock-msg-1",
    conversationId: "mock-conv-0",
    senderId: "mock-model-0",
    body: "Thank you! I'd be very interested. When are the shoot dates?",
    attachmentUrl: null,
    createdAt: new Date("2025-01-15T11:00:00"),
  },
  {
    id: "mock-msg-2",
    conversationId: "mock-conv-0",
    senderId: "mock-brand-0",
    body: "March 15-20 in Paris. I'll send you the details soon.",
    attachmentUrl: null,
    createdAt: new Date("2025-01-15T11:30:00"),
  },
  {
    id: "mock-msg-3",
    conversationId: "mock-conv-1",
    senderId: "mock-agency-0",
    body: "Your updated comp card is ready for review. Please approve before we send to clients.",
    attachmentUrl: null,
    createdAt: new Date("2025-01-20T14:00:00"),
  },
]

const seedFollows = [
  { followerId: "mock-model-0", followingId: "mock-brand-0", createdAt: new Date("2025-01-01") },
  { followerId: "mock-model-0", followingId: "mock-brand-1", createdAt: new Date("2025-01-02") },
  { followerId: "mock-model-1", followingId: "mock-model-0", createdAt: new Date("2025-01-03") },
  { followerId: "mock-brand-0", followingId: "mock-model-0", createdAt: new Date("2025-01-04") },
  { followerId: "mock-model-2", followingId: "mock-model-0", createdAt: new Date("2025-01-05") },
  { followerId: "mock-model-3", followingId: "mock-model-0", createdAt: new Date("2025-01-06") },
  { followerId: "mock-model-0", followingId: "mock-agency-0", createdAt: new Date("2025-01-07") },
]

const seedUserSettings = seedUsers.map((u) => ({
  userId: u.id,
  notifications: { push: true, email: true },
  darkMode: true,
  privacy: { mode: "public" },
  createdAt: new Date(),
  updatedAt: new Date(),
}))

const seedPostLikes = [
  { userId: "mock-model-0", postId: "mock-post-1", createdAt: new Date() },
  { userId: "mock-brand-0", postId: "mock-post-0", createdAt: new Date() },
  { userId: "mock-model-1", postId: "mock-post-0", createdAt: new Date() },
]

// ─── In-Memory Store ────────────────────────────────────────────────────────

type Store = Record<string, any[]>

const store: Store = {
  user: [...seedUsers],
  profile: [...seedProfiles],
  modelProfile: [...seedModelProfiles],
  agencyProfile: [...seedAgencyProfiles],
  brandProfile: [...seedBrandProfiles],
  refreshToken: [],
  follow: [...seedFollows],
  casting: [...seedCastings],
  savedCasting: [],
  castingRequirement: [...seedCastingRequirements],
  submission: [...seedSubmissions],
  conversation: [...seedConversations],
  conversationMember: [...seedConversationMembers],
  message: [...seedMessages],
  notification: [...seedNotifications],
  mediaAsset: [],
  digitalTwin: [],
  userSettings: [...seedUserSettings],
  post: [...seedPosts],
  postLike: [...seedPostLikes],
  postSave: [],
  comment: [],
}

// ─── Relation Definitions ───────────────────────────────────────────────────

interface Relation {
  type: "one" | "many"
  model: string
  foreignKey: string
  localKey: string
}

const relations: Record<string, Record<string, Relation>> = {
  user: {
    profile: { type: "one", model: "profile", foreignKey: "userId", localKey: "id" },
    modelProfile: { type: "one", model: "modelProfile", foreignKey: "userId", localKey: "id" },
    agencyProfile: { type: "one", model: "agencyProfile", foreignKey: "userId", localKey: "id" },
    brandProfile: { type: "one", model: "brandProfile", foreignKey: "userId", localKey: "id" },
    settings: { type: "one", model: "userSettings", foreignKey: "userId", localKey: "id" },
    posts: { type: "many", model: "post", foreignKey: "userId", localKey: "id" },
    followers: { type: "many", model: "follow", foreignKey: "followingId", localKey: "id" },
    following: { type: "many", model: "follow", foreignKey: "followerId", localKey: "id" },
    notifications: { type: "many", model: "notification", foreignKey: "userId", localKey: "id" },
    refreshTokens: { type: "many", model: "refreshToken", foreignKey: "userId", localKey: "id" },
    castings: { type: "many", model: "casting", foreignKey: "createdBy", localKey: "id" },
    submissions: { type: "many", model: "submission", foreignKey: "modelId", localKey: "id" },
    savedCastings: { type: "many", model: "savedCasting", foreignKey: "userId", localKey: "id" },
    mediaAssets: { type: "many", model: "mediaAsset", foreignKey: "ownerId", localKey: "id" },
    conversationMembers: { type: "many", model: "conversationMember", foreignKey: "userId", localKey: "id" },
    messages: { type: "many", model: "message", foreignKey: "senderId", localKey: "id" },
    postLikes: { type: "many", model: "postLike", foreignKey: "userId", localKey: "id" },
    postSaves: { type: "many", model: "postSave", foreignKey: "userId", localKey: "id" },
    comments: { type: "many", model: "comment", foreignKey: "userId", localKey: "id" },
  },
  casting: {
    requirements: { type: "one", model: "castingRequirement", foreignKey: "castingId", localKey: "id" },
    submissions: { type: "many", model: "submission", foreignKey: "castingId", localKey: "id" },
    creator: { type: "one", model: "user", foreignKey: "id", localKey: "createdBy" },
    savedBy: { type: "many", model: "savedCasting", foreignKey: "castingId", localKey: "id" },
    rooms: { type: "many", model: "conversation", foreignKey: "castingId", localKey: "id" },
  },
  submission: {
    casting: { type: "one", model: "casting", foreignKey: "id", localKey: "castingId" },
    model: { type: "one", model: "user", foreignKey: "id", localKey: "modelId" },
  },
  profile: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  modelProfile: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    digitalTwin: { type: "one", model: "digitalTwin", foreignKey: "userId", localKey: "userId" },
  },
  agencyProfile: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  brandProfile: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  post: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    likes: { type: "many", model: "postLike", foreignKey: "postId", localKey: "id" },
    saves: { type: "many", model: "postSave", foreignKey: "postId", localKey: "id" },
    comments: { type: "many", model: "comment", foreignKey: "postId", localKey: "id" },
  },
  comment: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    post: { type: "one", model: "post", foreignKey: "id", localKey: "postId" },
  },
  notification: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  conversation: {
    members: { type: "many", model: "conversationMember", foreignKey: "conversationId", localKey: "id" },
    messages: { type: "many", model: "message", foreignKey: "conversationId", localKey: "id" },
    casting: { type: "one", model: "casting", foreignKey: "id", localKey: "castingId" },
  },
  conversationMember: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    conversation: { type: "one", model: "conversation", foreignKey: "id", localKey: "conversationId" },
  },
  message: {
    sender: { type: "one", model: "user", foreignKey: "id", localKey: "senderId" },
    conversation: { type: "one", model: "conversation", foreignKey: "id", localKey: "conversationId" },
  },
  follow: {
    follower: { type: "one", model: "user", foreignKey: "id", localKey: "followerId" },
    following: { type: "one", model: "user", foreignKey: "id", localKey: "followingId" },
  },
  savedCasting: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    casting: { type: "one", model: "casting", foreignKey: "id", localKey: "castingId" },
  },
  digitalTwin: {
    user: { type: "one", model: "modelProfile", foreignKey: "userId", localKey: "userId" },
  },
  mediaAsset: {
    owner: { type: "one", model: "user", foreignKey: "id", localKey: "ownerId" },
  },
  userSettings: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  castingRequirement: {
    casting: { type: "one", model: "casting", foreignKey: "id", localKey: "castingId" },
  },
  refreshToken: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
  },
  postLike: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    post: { type: "one", model: "post", foreignKey: "id", localKey: "postId" },
  },
  postSave: {
    user: { type: "one", model: "user", foreignKey: "id", localKey: "userId" },
    post: { type: "one", model: "post", foreignKey: "id", localKey: "postId" },
  },
}

// ─── Query Engine ───────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function matchesWhere(record: any, where: any): boolean {
  if (!where) return true

  for (const [key, value] of Object.entries(where)) {
    if (key === "AND") {
      if (!(value as any[]).every((c: any) => matchesWhere(record, c))) return false
      continue
    }
    if (key === "OR") {
      if (!(value as any[]).some((c: any) => matchesWhere(record, c))) return false
      continue
    }
    if (key === "NOT") {
      if (matchesWhere(record, value)) return false
      continue
    }

    if (value === undefined) continue

    // Composite unique key pattern: fieldA_fieldB: { fieldA: x, fieldB: y }
    if (
      typeof value === "object" &&
      value !== null &&
      !Array.isArray(value) &&
      !(value instanceof Date) &&
      key.includes("_")
    ) {
      const parts = key.split("_")
      const isComposite = parts.every((p) => typeof (value as any)[p] !== "undefined")
      if (isComposite) {
        if (!matchesWhere(record, value)) return false
        continue
      }
    }

    // Filter operators
    if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
      if ("in" in value) {
        if (!value.in.includes(record[key])) return false
        continue
      }
      if ("notIn" in value) {
        if (value.notIn.includes(record[key])) return false
        continue
      }
      if ("contains" in value) {
        const mode = value.mode === "insensitive" ? "i" : ""
        if (!new RegExp(String(value.contains).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), mode).test(record[key] || ""))
          return false
        continue
      }
      if ("startsWith" in value) {
        if (!(record[key] || "").startsWith(value.startsWith)) return false
        continue
      }
      if ("endsWith" in value) {
        if (!(record[key] || "").endsWith(value.endsWith)) return false
        continue
      }
      if ("gte" in value) {
        if (record[key] < value.gte) return false
      }
      if ("lte" in value) {
        if (record[key] > value.lte) return false
      }
      if ("gt" in value) {
        if (record[key] <= value.gt) return false
      }
      if ("lt" in value) {
        if (record[key] >= value.lt) return false
      }
      if ("not" in value) {
        if (typeof value.not === "object" && value.not !== null) {
          if (matchesWhere({ [key]: record[key] }, { [key]: value.not })) return false
        } else {
          if (record[key] === value.not) return false
        }
        continue
      }
      if ("equals" in value) {
        if (record[key] !== value.equals) return false
        continue
      }
      if ("has" in value) {
        if (!Array.isArray(record[key]) || !record[key].includes(value.has)) return false
        continue
      }
      // If none of the operator keys matched, it might be a nested where on a relation
      // Just skip it gracefully
      continue
    }

    // Direct equality
    if (record[key] !== value) return false
  }
  return true
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function resolveIncludes(modelName: string, record: any, include: any): any {
  if (!include || !record) return record

  const result = { ...record }
  const modelRels = relations[modelName] || {}

  for (const [key, value] of Object.entries(include)) {
    if (key === "_count") {
      const countResult: any = {}
      const countSelect = (value as any)?.select || {}
      for (const countKey of Object.keys(countSelect)) {
        const rel = modelRels[countKey]
        if (rel) {
          countResult[countKey] = (store[rel.model] || []).filter(
            (r: any) => r[rel.foreignKey] === record[rel.localKey]
          ).length
        } else {
          countResult[countKey] = 0
        }
      }
      result._count = countResult
      continue
    }

    if (!value) continue
    const rel = modelRels[key]
    if (!rel) continue

    if (rel.type === "one") {
      const related = (store[rel.model] || []).find((r: any) => r[rel.foreignKey] === record[rel.localKey])
      if (typeof value === "object" && value !== null) {
        let resolved = related ? { ...related } : null
        if (resolved && (value as any).include) {
          resolved = resolveIncludes(rel.model, resolved, (value as any).include)
        }
        if (resolved && (value as any).select) {
          resolved = applySelect(resolved, (value as any).select)
        }
        result[key] = resolved
      } else {
        result[key] = related ? { ...related } : null
      }
    } else {
      let list = (store[rel.model] || [])
        .filter((r: any) => r[rel.foreignKey] === record[rel.localKey])
        .map((r: any) => ({ ...r }))

      if (typeof value === "object" && value !== null) {
        if ((value as any).where) list = list.filter((r: any) => matchesWhere(r, (value as any).where))
        if ((value as any).orderBy) list = applyOrderBy(list, (value as any).orderBy)
        if ((value as any).skip) list = list.slice((value as any).skip)
        if ((value as any).take) list = list.slice(0, (value as any).take)
        if ((value as any).include) list = list.map((r: any) => resolveIncludes(rel.model, r, (value as any).include))
        if ((value as any).select) list = list.map((r: any) => applySelect(r, (value as any).select))
      }
      result[key] = list
    }
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applySelect(record: any, select: any): any {
  if (!select) return record
  const result: any = {}
  for (const key of Object.keys(select)) {
    if (key === "_count") {
      // Handle _count inside select
      const countResult: any = {}
      const countSelect = (select._count as any)?.select || {}
      for (const countKey of Object.keys(countSelect)) {
        // Will be resolved if includes were already applied
        if (record._count) {
          countResult[countKey] = record._count[countKey] || 0
        }
      }
      result._count = countResult
      continue
    }
    if (select[key]) result[key] = record[key]
  }
  return result
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyOrderBy(records: any[], orderBy: any): any[] {
  if (!orderBy) return records
  const entries = Array.isArray(orderBy) ? orderBy : [orderBy]

  return [...records].sort((a, b) => {
    for (const entry of entries) {
      for (const [key, dir] of Object.entries(entry)) {
        const aVal = a[key]
        const bVal = b[key]
        if (aVal === bVal) continue
        if (aVal == null) return 1
        if (bVal == null) return -1
        const cmp = aVal < bVal ? -1 : 1
        return dir === "desc" ? -cmp : cmp
      }
    }
    return 0
  })
}

// ─── CRUD Operations ────────────────────────────────────────────────────────

// Models that use composite keys instead of auto-generated id
const COMPOSITE_KEY_MODELS = new Set([
  "profile",
  "modelProfile",
  "agencyProfile",
  "brandProfile",
  "userSettings",
  "castingRequirement",
  "follow",
  "savedCasting",
  "conversationMember",
  "postLike",
  "postSave",
  "digitalTwin",
])

function createModelAccessor(modelName: string) {
  return {
    findUnique: async (args: any = {}) => {
      const records = store[modelName] || []
      const record = records.find((r: any) => matchesWhere(r, args.where))
      if (!record) return null
      let result = { ...record }
      if (args.include) result = resolveIncludes(modelName, result, args.include)
      if (args.select) result = applySelect(result, args.select)
      return result
    },

    findFirst: async (args: any = {}) => {
      let records = store[modelName] || []
      if (args.where) records = records.filter((r: any) => matchesWhere(r, args.where))
      if (args.orderBy) records = applyOrderBy(records, args.orderBy)
      const record = records[0]
      if (!record) return null
      let result = { ...record }
      if (args.include) result = resolveIncludes(modelName, result, args.include)
      if (args.select) result = applySelect(result, args.select)
      return result
    },

    findMany: async (args: any = {}) => {
      let records = store[modelName] || []
      if (args.where) records = records.filter((r: any) => matchesWhere(r, args.where))
      if (args.orderBy) records = applyOrderBy(records, args.orderBy)
      if (args.cursor) {
        const idx = records.findIndex((r: any) => {
          for (const [k, v] of Object.entries(args.cursor)) {
            if (r[k] !== v) return false
          }
          return true
        })
        if (idx >= 0) records = records.slice(idx + 1)
      }
      if (args.skip) records = records.slice(args.skip)
      if (args.take) records = records.slice(0, args.take)
      if (args.distinct) {
        const seen = new Set<string>()
        records = records.filter((r: any) => {
          const key = args.distinct.map((d: string) => r[d]).join("|")
          if (seen.has(key)) return false
          seen.add(key)
          return true
        })
      }
      return records.map((r: any) => {
        let result = { ...r }
        if (args.include) result = resolveIncludes(modelName, result, args.include)
        if (args.select) result = applySelect(result, args.select)
        return result
      })
    },

    create: async (args: any = {}) => {
      const data = { ...args.data }

      // Auto-generate id if not composite key model
      if (!COMPOSITE_KEY_MODELS.has(modelName) && !data.id) {
        data.id = uuidv4()
      }
      if (!data.createdAt) data.createdAt = new Date()
      if (!data.updatedAt) data.updatedAt = new Date()

      // Handle nested creates and connects
      const modelRels = relations[modelName] || {}
      for (const [key, value] of Object.entries(data)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          const val = value as any
          if (val.create) {
            const rel = modelRels[key]
            if (rel) {
              const nestedData = { ...val.create }
              if (rel.foreignKey !== "id") {
                nestedData[rel.foreignKey] = data[rel.localKey] || data.id
              }
              if (!nestedData.createdAt) nestedData.createdAt = new Date()
              if (!nestedData.updatedAt) nestedData.updatedAt = new Date()
              if (!store[rel.model]) store[rel.model] = []
              store[rel.model].push(nestedData)
            }
            delete data[key]
          } else if (val.connect) {
            delete data[key]
          } else if (val.createMany) {
            const rel = modelRels[key]
            if (rel && val.createMany.data) {
              for (const item of val.createMany.data) {
                const nestedData = { ...item }
                if (rel.foreignKey !== "id") {
                  nestedData[rel.foreignKey] = data[rel.localKey] || data.id
                }
                if (!nestedData.createdAt) nestedData.createdAt = new Date()
                if (!store[rel.model]) store[rel.model] = []
                store[rel.model].push(nestedData)
              }
            }
            delete data[key]
          }
        }
      }

      if (!store[modelName]) store[modelName] = []
      store[modelName].push(data)

      let result = { ...data }
      if (args.include) result = resolveIncludes(modelName, result, args.include)
      if (args.select) result = applySelect(result, args.select)
      return result
    },

    update: async (args: any = {}) => {
      const records = store[modelName] || []
      const idx = records.findIndex((r: any) => matchesWhere(r, args.where))
      if (idx === -1) throw new Error(`Record not found in ${modelName}`)

      // Handle nested updates
      const updateData = { ...args.data }
      const modelRels = relations[modelName] || {}
      for (const [key, value] of Object.entries(updateData)) {
        if (typeof value === "object" && value !== null && !Array.isArray(value) && !(value instanceof Date)) {
          const val = value as any
          if (val.update || val.upsert || val.create || val.set !== undefined || val.increment !== undefined || val.decrement !== undefined) {
            if (val.increment !== undefined) {
              updateData[key] = (records[idx][key] || 0) + val.increment
            } else if (val.decrement !== undefined) {
              updateData[key] = (records[idx][key] || 0) - val.decrement
            } else {
              delete updateData[key]
            }
          }
        }
      }

      const updated = { ...records[idx], ...updateData, updatedAt: new Date() }
      records[idx] = updated

      let result = { ...updated }
      if (args.include) result = resolveIncludes(modelName, result, args.include)
      if (args.select) result = applySelect(result, args.select)
      return result
    },

    upsert: async (args: any = {}) => {
      const records = store[modelName] || []
      const existing = records.find((r: any) => matchesWhere(r, args.where))

      if (existing) {
        const idx = records.indexOf(existing)
        const updated = { ...existing, ...args.update, updatedAt: new Date() }
        records[idx] = updated
        let result = { ...updated }
        if (args.include) result = resolveIncludes(modelName, result, args.include)
        return result
      } else {
        const data = { ...args.create }
        if (!COMPOSITE_KEY_MODELS.has(modelName) && !data.id) data.id = uuidv4()
        if (!data.createdAt) data.createdAt = new Date()
        data.updatedAt = new Date()
        records.push(data)
        let result = { ...data }
        if (args.include) result = resolveIncludes(modelName, result, args.include)
        return result
      }
    },

    delete: async (args: any = {}) => {
      const records = store[modelName] || []
      const idx = records.findIndex((r: any) => matchesWhere(r, args.where))
      if (idx === -1) throw new Error(`Record not found in ${modelName}`)
      return records.splice(idx, 1)[0]
    },

    deleteMany: async (args: any = {}) => {
      const before = (store[modelName] || []).length
      store[modelName] = (store[modelName] || []).filter((r: any) => !matchesWhere(r, args?.where))
      return { count: before - (store[modelName] || []).length }
    },

    count: async (args: any = {}) => {
      let records = store[modelName] || []
      if (args?.where) records = records.filter((r: any) => matchesWhere(r, args.where))
      return records.length
    },

    updateMany: async (args: any = {}) => {
      const records = store[modelName] || []
      let count = 0
      for (let i = 0; i < records.length; i++) {
        if (matchesWhere(records[i], args.where)) {
          records[i] = { ...records[i], ...args.data, updatedAt: new Date() }
          count++
        }
      }
      return { count }
    },

    aggregate: async (args: any = {}) => {
      let records = store[modelName] || []
      if (args.where) records = records.filter((r: any) => matchesWhere(r, args.where))
      return { _count: { _all: records.length } }
    },

    groupBy: async (args: any = {}) => {
      let records = store[modelName] || []
      if (args.where) records = records.filter((r: any) => matchesWhere(r, args.where))
      const groups = new Map<string, any[]>()
      for (const r of records) {
        const key = (args.by as string[]).map((k: string) => r[k]).join("|")
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(r)
      }
      return Array.from(groups.entries()).map(([, items]) => {
        const result: any = {}
        for (const k of args.by as string[]) result[k] = items[0][k]
        if (args._count) result._count = items.length
        return result
      })
    },
  }
}

// ─── Mock Prisma Client ─────────────────────────────────────────────────────

export function createMockPrismaClient(): any {
  const allModelNames = Object.keys(store)

  const client: any = {
    $connect: async () => {},
    $disconnect: async () => {},
    $transaction: async (arg: any) => {
      if (Array.isArray(arg)) return Promise.all(arg)
      if (typeof arg === "function") return arg(client)
      return arg
    },
    $queryRaw: async () => [],
    $executeRaw: async () => 0,
  }

  for (const name of allModelNames) {
    client[name] = createModelAccessor(name)
  }

  return client
}

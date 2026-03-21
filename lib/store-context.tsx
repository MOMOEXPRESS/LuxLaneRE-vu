"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"
import type { Casting, CastingApplication, User, Notification, JobOffer } from "./types"
import { mockUsers } from "./mock-data"

export function normalizeStatus<T extends string>(s: T): T {
  return s.toLowerCase().trim() as T
}

function futureDate(daysFromNow: number): Date {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d
}

function pastDate(daysAgo: number): Date {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return d
}

function createInitialCastings(): Casting[] {
  return [
    {
      id: "c1",
      creatorId: "2",
      creator: mockUsers[1], // Dior (brand)
      title: "Dior Spring 2025 Campaign",
      type: "campaign",
      description:
        "Seeking diverse female models for our upcoming Spring 2025 campaign. Shot by Steven Meisel in Paris.",
      location: "Paris, France",
      dates: { start: futureDate(30), end: futureDate(35) },
      pay: { amount: 15000, currency: "EUR", type: "flat" },
      requirements: {
        gender: "female",
        heightRange: { min: "175 cm", max: "185 cm" },
        heightRangeCm: { min: 175, max: 185 },
        experience: ["runway", "editorial"],
        look: ["editorial", "high fashion"],
        tags: ["runway", "editorial", "high-fashion"],
      },
      deadline: futureDate(14),
      status: "active",
      applicationsCount: 45,
      shortlistedCount: 8,
      createdAt: pastDate(5),
      images: ["/dior-fashion-campaign-spring-aesthetic.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 5, requireDigitalTwin: false },
      roomId: "room1",
    },
    {
      id: "c2",
      creatorId: "7",
      creator: mockUsers[6], // Gucci (brand)
      title: "Gucci Milan Fashion Week",
      type: "runway",
      description: "Open casting for Gucci FW25 runway show in Milan.",
      location: "Milan, Italy",
      dates: { start: futureDate(45), end: futureDate(46) },
      pay: { amount: 5000, currency: "EUR", type: "flat" },
      requirements: {
        gender: "any",
        heightRange: { min: "178 cm", max: "188 cm" },
        heightRangeCm: { min: 178, max: 188 },
        experience: ["runway"],
        look: ["avant-garde", "unique"],
        tags: ["runway", "avant-garde"],
      },
      deadline: futureDate(21),
      status: "active",
      applicationsCount: 120,
      shortlistedCount: 24,
      createdAt: pastDate(3),
      images: ["/gucci-fashion-show-runway-aesthetic.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 10, requireDigitalTwin: false },
    },
    {
      id: "c3",
      creatorId: "4",
      creator: mockUsers[3], // Alexander Chen (client)
      title: "Vogue Italia Editorial",
      type: "editorial",
      description: "Editorial shoot for Vogue Italia March issue. Theme: Modern Renaissance.",
      location: "Florence, Italy",
      dates: { start: futureDate(20), end: futureDate(22) },
      pay: { amount: 3500, currency: "EUR", type: "flat" },
      requirements: {
        gender: "female",
        ageRange: { min: 18, max: 35 },
        look: ["classic", "elegant"],
        tags: ["editorial", "classic"],
      },
      deadline: futureDate(10),
      status: "active",
      applicationsCount: 67,
      shortlistedCount: 5,
      createdAt: pastDate(7),
      images: ["/vogue-editorial-renaissance.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 3, requireDigitalTwin: true },
    },
    {
      id: "c4",
      creatorId: "3",
      creator: mockUsers[2], // Elite Models (agency)
      title: "Elite New Faces 2025",
      type: "event",
      description:
        "Annual scouting event for new talent. If you're 16-22 and dream of a modeling career, this is your chance.",
      location: "New York, NY",
      dates: { start: futureDate(60), end: futureDate(60) },
      pay: { amount: 0, currency: "USD", type: "tbd" },
      requirements: {
        ageRange: { min: 16, max: 22 },
        other: "No experience necessary. Bring polaroids and comp card if available.",
      },
      deadline: futureDate(45),
      status: "active",
      applicationsCount: 340,
      shortlistedCount: 0,
      createdAt: pastDate(2),
      images: ["/model-casting-event.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 20, requireDigitalTwin: false },
    },
    {
      id: "c5",
      creatorId: "2",
      creator: mockUsers[1], // Dior
      title: "Dior Haute Couture Fitting",
      type: "fitting",
      description: "Fitting session for upcoming Haute Couture collection. Must be based in Paris.",
      location: "Paris, France",
      dates: { start: futureDate(7), end: futureDate(7) },
      pay: { amount: 800, currency: "EUR", type: "flat" },
      requirements: {
        gender: "female",
        heightRange: { min: "175 cm", max: "180 cm" },
        heightRangeCm: { min: 175, max: 180 },
        tags: ["fitting", "couture"],
      },
      deadline: futureDate(5),
      status: "active",
      applicationsCount: 28,
      shortlistedCount: 4,
      createdAt: pastDate(1),
      images: ["/dior-fashion-campaign-spring-aesthetic.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 3, requireDigitalTwin: false },
    },
    {
      id: "c6",
      creatorId: "7",
      creator: mockUsers[6], // Gucci
      title: "Gucci Beauty Campaign",
      type: "campaign",
      description: "Close-up beauty campaign for Gucci Flora fragrance.",
      location: "Los Angeles, CA",
      dates: { start: futureDate(25), end: futureDate(27) },
      pay: { amount: 12000, currency: "USD", type: "flat" },
      requirements: {
        gender: "female",
        ageRange: { min: 20, max: 30 },
        look: ["natural beauty", "fresh"],
        tags: ["beauty", "campaign"],
      },
      deadline: futureDate(18),
      status: "active",
      applicationsCount: 89,
      shortlistedCount: 12,
      createdAt: pastDate(4),
      images: ["/gucci-fashion-show-runway-aesthetic.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 5, requireDigitalTwin: true },
    },
    {
      id: "c7",
      creatorId: "3",
      creator: mockUsers[2], // Elite Models
      title: "London Fashion Week Showroom",
      type: "runway",
      description: "Multiple designers seeking models for LFW showroom presentations.",
      location: "London, UK",
      dates: { start: futureDate(40), end: futureDate(44) },
      pay: { amount: 3000, currency: "GBP", type: "flat" },
      requirements: {
        gender: "any",
        heightRange: { min: "175 cm", max: "188 cm" },
        heightRangeCm: { min: 175, max: 188 },
        experience: ["runway"],
        tags: ["runway", "fashion-week"],
      },
      deadline: futureDate(30),
      status: "active",
      applicationsCount: 156,
      shortlistedCount: 20,
      createdAt: pastDate(6),
      images: ["/runway-fashion-week-model.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 8, requireDigitalTwin: false },
    },
    {
      id: "c8",
      creatorId: "4",
      creator: mockUsers[3], // Alexander Chen
      title: "Harper's Bazaar Cover Shoot",
      type: "editorial",
      description: "Cover story featuring emerging models. Looking for strong editorial presence.",
      location: "New York, NY",
      dates: { start: futureDate(15), end: futureDate(16) },
      pay: { amount: 8000, currency: "USD", type: "flat" },
      requirements: {
        gender: "female",
        heightRange: { min: "176 cm", max: "183 cm" },
        heightRangeCm: { min: 176, max: 183 },
        experience: ["editorial"],
        look: ["editorial", "versatile"],
        tags: ["editorial", "cover"],
      },
      deadline: futureDate(8),
      status: "active",
      applicationsCount: 78,
      shortlistedCount: 6,
      createdAt: pastDate(3),
      images: ["/high-fashion-editorial-model.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 4, requireDigitalTwin: false },
    },
    {
      id: "c9",
      creatorId: "2",
      creator: mockUsers[1], // Dior
      title: "Dior Men's Campaign",
      type: "campaign",
      description: "Seeking male models for Dior Men's Spring collection campaign.",
      location: "Paris, France",
      dates: { start: futureDate(35), end: futureDate(38) },
      pay: { amount: 10000, currency: "EUR", type: "flat" },
      requirements: {
        gender: "male",
        heightRange: { min: "185 cm", max: "195 cm" },
        heightRangeCm: { min: 185, max: 195 },
        experience: ["campaign"],
        tags: ["menswear", "campaign"],
      },
      deadline: futureDate(25),
      status: "active",
      applicationsCount: 52,
      shortlistedCount: 8,
      createdAt: pastDate(4),
      images: ["/dior-fashion-campaign-spring-aesthetic.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 5, requireDigitalTwin: false },
    },
    {
      id: "c10",
      creatorId: "7",
      creator: mockUsers[6], // Gucci
      title: "Gucci Cruise Collection Lookbook",
      type: "commercial",
      description: "Lookbook shoot for Gucci Cruise 2025 collection.",
      location: "Amalfi Coast, Italy",
      dates: { start: futureDate(50), end: futureDate(53) },
      pay: { amount: 7500, currency: "EUR", type: "flat" },
      requirements: {
        gender: "any",
        heightRange: { min: "175 cm", max: "185 cm" },
        heightRangeCm: { min: 175, max: 185 },
        look: ["commercial", "lifestyle"],
        tags: ["commercial", "lookbook"],
      },
      deadline: futureDate(35),
      status: "active",
      applicationsCount: 94,
      shortlistedCount: 15,
      createdAt: pastDate(2),
      images: ["/gucci-fashion-show-runway-aesthetic.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 6, requireDigitalTwin: false },
    },
    {
      id: "c11",
      creatorId: "3",
      creator: mockUsers[2], // Elite
      title: "Swimwear Brand Campaign",
      type: "commercial",
      description: "Major swimwear brand seeking models for summer campaign in Maldives.",
      location: "Maldives",
      dates: { start: futureDate(55), end: futureDate(60) },
      pay: { amount: 15000, currency: "USD", type: "flat" },
      requirements: {
        gender: "female",
        ageRange: { min: 20, max: 28 },
        look: ["beach", "athletic"],
        tags: ["swimwear", "commercial"],
      },
      deadline: futureDate(40),
      status: "active",
      applicationsCount: 210,
      shortlistedCount: 10,
      createdAt: pastDate(1),
      images: ["/luxury-brand-campaign-model.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 5, requireDigitalTwin: false },
    },
    {
      id: "c12",
      creatorId: "4",
      creator: mockUsers[3], // Alexander Chen
      title: "Portrait Photography Series",
      type: "editorial",
      description: "Intimate portrait series exploring identity and expression. Art project with gallery exhibition.",
      location: "Los Angeles, CA",
      dates: { start: futureDate(12), end: futureDate(14) },
      pay: { amount: 2500, currency: "USD", type: "flat" },
      requirements: {
        gender: "any",
        look: ["unique", "expressive"],
        tags: ["editorial", "art"],
        other: "Open to all ethnicities and unconventional looks.",
      },
      deadline: futureDate(7),
      status: "active",
      applicationsCount: 145,
      shortlistedCount: 8,
      createdAt: pastDate(5),
      images: ["/professional-model-headshot-woman-brunette.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 10, requireDigitalTwin: false },
    },
    {
      id: "c13",
      creatorId: "9",
      creator: mockUsers[8], // Next Models
      title: "Next Models Open Call NYC",
      type: "event",
      description:
        "Looking for fresh faces ages 14-21. Open call at our NYC headquarters. Bring a parent/guardian if under 18.",
      location: "New York, NY",
      dates: { start: futureDate(20), end: futureDate(20) },
      pay: { amount: 0, currency: "USD", type: "tbd" },
      requirements: {
        ageRange: { min: 14, max: 21 },
        other: "No experience needed. Come with clean skin, minimal makeup.",
      },
      deadline: futureDate(15),
      status: "active",
      applicationsCount: 280,
      shortlistedCount: 0,
      createdAt: pastDate(3),
      images: ["/model-casting-event.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 20, requireDigitalTwin: false },
    },
    {
      id: "c14",
      creatorId: "9",
      creator: mockUsers[8], // Next Models
      title: "Next x Zara Campaign",
      type: "campaign",
      description:
        "Exclusive casting for Zara's upcoming global campaign. Seeking diverse talent for a multi-day shoot in Barcelona.",
      location: "Barcelona, Spain",
      dates: { start: futureDate(35), end: futureDate(39) },
      pay: { amount: 8000, currency: "EUR", type: "flat" },
      requirements: {
        gender: "any",
        heightRange: { min: "175 cm", max: "188 cm" },
        heightRangeCm: { min: 175, max: 188 },
        experience: ["campaign", "commercial"],
        tags: ["commercial", "campaign"],
      },
      deadline: futureDate(25),
      status: "active",
      applicationsCount: 134,
      shortlistedCount: 16,
      createdAt: pastDate(4),
      images: ["/luxury-brand-campaign-model.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 5, requireDigitalTwin: false },
    },
    {
      id: "c15",
      creatorId: "10",
      creator: mockUsers[9], // IMG Models
      title: "IMG Worldwide Scouting",
      type: "event",
      description:
        "Annual global talent search. We're looking for the next generation of supermodels. Virtual submissions welcome.",
      location: "Worldwide (Virtual)",
      dates: { start: futureDate(30), end: futureDate(60) },
      pay: { amount: 0, currency: "USD", type: "tbd" },
      requirements: {
        ageRange: { min: 15, max: 25 },
        other: "Submit 3 recent polaroids and a short video introduction.",
      },
      deadline: futureDate(25),
      status: "active",
      applicationsCount: 1200,
      shortlistedCount: 45,
      createdAt: pastDate(7),
      images: ["/professional-model-headshot-woman-brunette.jpg"],
      settings: { verifiedOnly: false, maxSubmissionsPerAgency: 50, requireDigitalTwin: false },
    },
    {
      id: "c16",
      creatorId: "10",
      creator: mockUsers[9], // IMG Models
      title: "Victoria's Secret Runway Casting",
      type: "runway",
      description:
        "Casting for the highly anticipated Victoria's Secret Fashion Show. Seeking experienced runway models with strong walk.",
      location: "New York, NY",
      dates: { start: futureDate(50), end: futureDate(51) },
      pay: { amount: 25000, currency: "USD", type: "flat" },
      requirements: {
        gender: "female",
        heightRange: { min: "178 cm", max: "185 cm" },
        heightRangeCm: { min: 178, max: 185 },
        experience: ["runway", "editorial"],
        look: ["athletic", "glamorous"],
        tags: ["runway", "lingerie", "high-fashion"],
      },
      deadline: futureDate(35),
      status: "active",
      applicationsCount: 450,
      shortlistedCount: 30,
      createdAt: pastDate(5),
      images: ["/runway-fashion-week-model.jpg"],
      settings: { verifiedOnly: true, maxSubmissionsPerAgency: 8, requireDigitalTwin: true },
    },
  ]
}

function createInitialApplications(castings: Casting[]): CastingApplication[] {
  return [
    {
      id: "a1",
      castingId: "c1",
      casting: castings[0],
      modelId: "1",
      model: mockUsers[0],
      status: "shortlisted",
      message: "Excited to be part of this campaign. I have extensive experience with Dior.",
      portfolioSelection: ["/high-fashion-editorial-model.jpg", "/runway-fashion-week-model.jpg"],
      submittedAt: pastDate(4),
      updatedAt: pastDate(2),
    },
    {
      id: "a2",
      castingId: "c2",
      casting: castings[1],
      modelId: "1",
      model: mockUsers[0],
      status: "pending",
      message: "I would be honored to walk for Gucci at Milan Fashion Week.",
      portfolioSelection: ["/runway-fashion-week-model.jpg"],
      submittedAt: pastDate(2),
      updatedAt: pastDate(2),
    },
    {
      id: "a3",
      castingId: "c1",
      casting: castings[0],
      modelId: "5",
      model: mockUsers[4],
      status: "pending",
      message: "I bring a fresh Italian perspective to high fashion campaigns.",
      submittedAt: pastDate(3),
      updatedAt: pastDate(3),
    },
    {
      id: "a4",
      castingId: "c1",
      casting: castings[0],
      modelId: "8",
      model: mockUsers[7],
      status: "shortlisted",
      message: "Ready to bring elegance and precision to your campaign.",
      submittedAt: pastDate(4),
      updatedAt: pastDate(1),
    },
    {
      id: "a5",
      castingId: "c3",
      casting: castings[2],
      modelId: "1",
      model: mockUsers[0],
      status: "accepted",
      message: "Would love to be part of this editorial.",
      submittedAt: pastDate(5),
      updatedAt: pastDate(1),
    },
    {
      id: "a6",
      castingId: "c5",
      casting: castings[4],
      modelId: "5",
      model: mockUsers[4],
      status: "pending",
      message: "Available for the fitting dates.",
      submittedAt: pastDate(1),
      updatedAt: pastDate(1),
    },
    {
      id: "a7",
      castingId: "c6",
      casting: castings[5],
      modelId: "8",
      model: mockUsers[7],
      status: "shortlisted",
      message: "Perfect for beauty campaigns.",
      submittedAt: pastDate(3),
      updatedAt: pastDate(2),
    },
    {
      id: "a8",
      castingId: "c7",
      casting: castings[6],
      modelId: "1",
      model: mockUsers[0],
      status: "pending",
      message: "Excited for LFW!",
      submittedAt: pastDate(2),
      updatedAt: pastDate(2),
    },
    {
      id: "a9",
      castingId: "c8",
      casting: castings[7],
      modelId: "5",
      model: mockUsers[4],
      status: "shortlisted",
      message: "Cover shoot would be amazing.",
      submittedAt: pastDate(2),
      updatedAt: pastDate(1),
    },
    {
      id: "a10",
      castingId: "c2",
      casting: castings[1],
      modelId: "5",
      model: mockUsers[4],
      status: "pending",
      message: "Love to walk for Gucci.",
      submittedAt: pastDate(1),
      updatedAt: pastDate(1),
    },
  ]
}

function createInitialNotifications(): Notification[] {
  return [
    {
      id: "n1",
      userId: "1",
      type: "shortlisted",
      title: "You've been shortlisted!",
      message: "Dior has shortlisted you for Spring 2025 Campaign",
      read: false,
      actionUrl: "/castings/c1",
      metadata: { castingId: "c1" },
      createdAt: pastDate(2),
    },
    {
      id: "n2",
      userId: "1",
      type: "casting_invite",
      title: "New Casting Invite",
      message: "Gucci has invited you to Milan Fashion Week casting",
      read: false,
      actionUrl: "/castings/c2",
      metadata: { castingId: "c2" },
      createdAt: pastDate(1),
    },
    {
      id: "n3",
      userId: "1",
      type: "accepted",
      title: "Booking Confirmed!",
      message: "Your booking for Vogue Italia Editorial is confirmed",
      read: true,
      actionUrl: "/castings/c3",
      metadata: { castingId: "c3" },
      createdAt: pastDate(1),
    },
  ]
}

function createInitialOffers(castings: Casting[]): JobOffer[] {
  return [
    {
      id: "o1",
      castingId: "c3",
      casting: castings[2],
      senderId: "4",
      sender: mockUsers[3],
      modelId: "1",
      model: mockUsers[0],
      title: "Vogue Italia Editorial",
      description: "You've been selected for our Modern Renaissance editorial shoot.",
      dates: { start: futureDate(20), end: futureDate(22) },
      pay: { amount: 3500, currency: "EUR", type: "flat" },
      location: "Florence, Italy",
      status: "accepted",
      expiresAt: futureDate(5),
      createdAt: pastDate(3),
    },
  ]
}

interface StoreState {
  castings: Casting[]
  applications: CastingApplication[]
  users: User[]
  notifications: Notification[]
  offers: JobOffer[]
}

interface StoreContextValue extends StoreState {
  // Getters
  getCastings: () => Casting[]
  getActiveCastings: () => Casting[]
  getCastingsForCreator: (creatorId: string) => Casting[]
  getCasting: (id: string) => Casting | undefined
  getApplications: () => CastingApplication[]
  getApplicationsForModel: (modelId: string) => CastingApplication[]
  getApplicationsForCasting: (castingId: string) => CastingApplication[]
  getUsers: () => User[]
  getUser: (id: string) => User | undefined
  getNotificationsForUser: (userId: string) => Notification[]
  getUnreadNotificationsCount: (userId: string) => number
  getOffersForModel: (modelId: string) => JobOffer[]
  getPendingOffersForModel: (modelId: string) => JobOffer[]

  // Mutators
  addCasting: (casting: Casting) => void
  updateCasting: (id: string, updates: Partial<Casting>) => void
  addApplication: (application: CastingApplication) => void
  updateApplication: (id: string, updates: Partial<CastingApplication>) => void
  addNotification: (notification: Notification) => void
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: (userId: string) => void
  addOffer: (offer: JobOffer) => void
  updateOffer: (id: string, updates: Partial<JobOffer>) => void

  // Utils
  reseed: () => void
}

const StoreContext = createContext<StoreContextValue | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<StoreState>(() => {
    const castings = createInitialCastings()
    const applications = createInitialApplications(castings)
    const notifications = createInitialNotifications()
    const offers = createInitialOffers(castings)
    return {
      castings,
      applications,
      users: mockUsers,
      notifications,
      offers,
    }
  })

  // Getters
  const getCastings = useCallback(() => state.castings, [state.castings])

  const getActiveCastings = useCallback(() => {
    return state.castings.filter((c) => normalizeStatus(c.status) === "active")
  }, [state.castings])

  const getCastingsForCreator = useCallback(
    (creatorId: string) => {
      return state.castings.filter((c) => c.creatorId === creatorId)
    },
    [state.castings],
  )

  const getCasting = useCallback(
    (id: string) => {
      return state.castings.find((c) => c.id === id)
    },
    [state.castings],
  )

  const getApplications = useCallback(() => state.applications, [state.applications])

  const getApplicationsForModel = useCallback(
    (modelId: string) => {
      return state.applications.filter((a) => a.modelId === modelId)
    },
    [state.applications],
  )

  const getApplicationsForCasting = useCallback(
    (castingId: string) => {
      return state.applications.filter((a) => a.castingId === castingId)
    },
    [state.applications],
  )

  const getUsers = useCallback(() => state.users, [state.users])

  const getUser = useCallback(
    (id: string) => {
      return state.users.find((u) => u.id === id)
    },
    [state.users],
  )

  const getNotificationsForUser = useCallback(
    (userId: string) => {
      return state.notifications
        .filter((n) => n.userId === userId)
        .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    },
    [state.notifications],
  )

  const getUnreadNotificationsCount = useCallback(
    (userId: string) => {
      return state.notifications.filter((n) => n.userId === userId && !n.read).length
    },
    [state.notifications],
  )

  const getOffersForModel = useCallback(
    (modelId: string) => {
      return state.offers.filter((o) => o.modelId === modelId)
    },
    [state.offers],
  )

  const getPendingOffersForModel = useCallback(
    (modelId: string) => {
      return state.offers.filter((o) => o.modelId === modelId && o.status === "pending")
    },
    [state.offers],
  )

  // Mutators
  const addCasting = useCallback((casting: Casting) => {
    setState((prev) => ({
      ...prev,
      castings: [casting, ...prev.castings],
    }))
  }, [])

  const updateCasting = useCallback((id: string, updates: Partial<Casting>) => {
    setState((prev) => ({
      ...prev,
      castings: prev.castings.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    }))
  }, [])

  const addApplication = useCallback((application: CastingApplication) => {
    setState((prev) => ({
      ...prev,
      applications: [application, ...prev.applications],
    }))
  }, [])

  const updateApplication = useCallback((id: string, updates: Partial<CastingApplication>) => {
    setState((prev) => ({
      ...prev,
      applications: prev.applications.map((a) => (a.id === id ? { ...a, ...updates } : a)),
    }))
  }, [])

  const addNotification = useCallback((notification: Notification) => {
    setState((prev) => ({
      ...prev,
      notifications: [notification, ...prev.notifications],
    }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])

  const markAllNotificationsRead = useCallback((userId: string) => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => (n.userId === userId ? { ...n, read: true } : n)),
    }))
  }, [])

  const addOffer = useCallback((offer: JobOffer) => {
    setState((prev) => ({
      ...prev,
      offers: [offer, ...prev.offers],
    }))
  }, [])

  const updateOffer = useCallback((id: string, updates: Partial<JobOffer>) => {
    setState((prev) => ({
      ...prev,
      offers: prev.offers.map((o) => (o.id === id ? { ...o, ...updates } : o)),
    }))
  }, [])

  // Reseed
  const reseed = useCallback(() => {
    const castings = createInitialCastings()
    const applications = createInitialApplications(castings)
    const notifications = createInitialNotifications()
    const offers = createInitialOffers(castings)
    setState({
      castings,
      applications,
      users: mockUsers,
      notifications,
      offers,
    })
  }, [])

  const value: StoreContextValue = {
    ...state,
    getCastings,
    getActiveCastings,
    getCastingsForCreator,
    getCasting,
    getApplications,
    getApplicationsForModel,
    getApplicationsForCasting,
    getUsers,
    getUser,
    getNotificationsForUser,
    getUnreadNotificationsCount,
    getOffersForModel,
    getPendingOffersForModel,
    addCasting,
    updateCasting,
    addApplication,
    updateApplication,
    addNotification,
    markNotificationRead,
    markAllNotificationsRead,
    addOffer,
    updateOffer,
    reseed,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const context = useContext(StoreContext)
  if (!context) {
    throw new Error("useStore must be used within a StoreProvider")
  }
  return context
}

export type UserRole = "model" | "brand" | "agency" | "client"

export type VerificationLevel = "unverified" | "agency_verified" | "luxlane_verified"

export interface User {
  id: string
  email: string
  name: string
  username: string
  role: UserRole
  verified: boolean
  verificationLevel: VerificationLevel
  avatar: string
  bio: string
  location: string
  followers: number
  following: number
  isFollowing?: boolean
  createdAt: Date
  // Model-specific
  measurements?: ModelMeasurements
  portfolio?: string[]
  polaroids?: string[]
  availability?: AvailabilitySlot[]
  availabilityStatus?: "available" | "hold" | "booked"
  experience?: string[]
  languages?: string[]
  skinTone?: string
  tags?: string[] // Added tags for matching
  digitalTwin?: DigitalTwin
  /** Profile posts (from API when viewing another user) */
  posts?: Array<{ id: string; imageUrl: string; caption?: string | null; createdAt: string; likesCount?: number; commentsCount?: number }>
  metrics?: ModelMetrics
  agencyId?: string
  // Brand/Agency/Client specific
  companyName?: string
  website?: string
  roster?: string[]
  industry?: string
  socialLinks?: { instagram?: string; tiktok?: string }
}

export interface ModelMeasurements {
  height?: string
  bust?: string
  waist?: string
  hips?: string
  shoeSize?: string
  dressSize?: string
  hairColor?: string
  eyeColor?: string
  heightCm?: number
}

export interface AvailabilitySlot {
  date: Date
  available: boolean
}

export interface DigitalTwin {
  id: string
  modelId: string
  status: "none" | "pending" | "processing" | "ready" | "complete" | "failed"
  createdAt: Date
  updatedAt: Date
  headScan?: string
  fullBodyScan?: string
  previewUrl?: string
  inputImages?: string[]
  attributes?: DigitalTwinAttributes
}

export interface FacialAnalysis {
  symmetryScore: number
  goldenRatioScore: number
  facialThirds: { upper: number; middle: number; lower: number }
  jawAngle: number
  eyeSpacing: "close" | "ideal" | "wide"
  noseBridgeRatio: number
  lipToFaceRatio: number
  overallHarmony: number
}

export interface DigitalTwinAttributes {
  faceShape: string
  skinTone: string
  eyeColor: string
  jawline: string
  cheekbones: string
  noseType: string
  lipShape: string
  preciseHeight: string
  preciseChest: string
  preciseWaist: string
  preciseHips: string
  shoulderWidth: string
  armLength: string
  legLength: string
  analysis?: FacialAnalysis
}

export interface ModelMetrics {
  luxlaneScore: number
  rank: number
  rankTier: "top10" | "top50" | "top100" | "top500" | "rising" | "new"
  trend: "up" | "down" | "stable"
  trendChange: number
  components: {
    bookings: number
    shortlists: number
    profileViews: number
    responseRate: number
    reliability: number
  }
  achievements: string[]
  lastUpdated: Date
}

// Casting system types
export type CastingType = "runway" | "campaign" | "editorial" | "commercial" | "event" | "fitting"
export type CastingStatus = "draft" | "active" | "closed" | "in_review" | "completed"
export type ApplicationStatus = "pending" | "applied" | "submitted" | "shortlisted" | "offered" | "accepted" | "declined" | "confirmed" | "rejected" | "withdrawn"

export interface Casting {
  id: string
  creatorId: string
  creator: User
  title: string
  type: CastingType
  description: string
  location: string
  dates: {
    start: Date
    end: Date
  }
  pay: {
    amount: number
    currency: string
    type: "hourly" | "flat" | "tbd"
  }
  requirements: ModelRequirements
  deadline: Date
  status: CastingStatus
  applicationsCount: number
  shortlistedCount: number
  createdAt: Date
  images?: string[]
  settings?: CastingSettings
  roomId?: string
}

export interface CastingSettings {
  verifiedOnly: boolean
  maxSubmissionsPerAgency: number
  requireDigitalTwin: boolean
}

export interface ModelRequirements {
  gender?: "male" | "female" | "non-binary" | "any"
  ageRange?: { min: number; max: number }
  heightRange?: { min: string; max: string }
  heightRangeCm?: { min: number; max: number } // Added for matching
  experience?: string[]
  look?: string[]
  tags?: string[] // Added for matching
  other?: string
}

export interface CastingApplication {
  id: string
  castingId: string
  casting?: Casting
  modelId: string
  model: User
  agencyId?: string // Added for agency submissions
  status: ApplicationStatus
  message?: string
  portfolioSelection?: string[] // Added for apply flow
  submittedAt: Date
  updatedAt: Date
}

export interface FitScore {
  total: number
  breakdown: {
    physical: number
    experience: number
    reliability: number
    brandAffinity: number
    momentum: number
  }
}

export interface ModelMatch {
  model: User
  fitScore: FitScore
}

export type CastingRoomStatus = "draft" | "active" | "live" | "completed"

export interface CastingRoom {
  id: string
  castingId: string
  casting: Casting
  status: CastingRoomStatus
  members: User[]
  createdAt: Date
  updatedAt: Date
}

export interface RoomEvent {
  id: string
  roomId: string
  type: "created" | "submission" | "shortlisted" | "offer_sent" | "offer_accepted" | "member_added" | "message"
  userId: string
  user: User
  targetUserId?: string
  targetUser?: User
  message?: string
  createdAt: Date
}

export interface RoomFile {
  id: string
  roomId: string
  name: string
  type: "moodboard" | "callsheet" | "contract" | "other"
  url: string
  uploadedBy: User
  createdAt: Date
}

export interface RoomScheduleItem {
  id: string
  roomId: string
  title: string
  date: Date
  time: string
  location?: string
  notes?: string
}

// Message system
export interface Message {
  id: string
  conversationId: string
  senderId: string
  content: string
  type: "text" | "casting_invite" | "offer" | "contract"
  metadata?: {
    castingId?: string
    offerId?: string
  }
  read: boolean
  createdAt: Date
}

export interface Conversation {
  id: string
  participants: User[]
  lastMessage: Message
  unreadCount: number
  updatedAt: Date
  type: "direct" | "casting" | "booking"
}

export interface Notification {
  id: string
  userId: string
  type: "casting_invite" | "offer" | "shortlisted" | "accepted" | "message" | "follow" | "room_update"
  title: string
  message: string
  read: boolean
  actionUrl?: string
  metadata?: {
    castingId?: string
    roomId?: string
    userId?: string
    relatedId?: string
    relatedType?: string
    [key: string]: unknown
  }
  createdAt: Date
}

// Job offer system
export interface JobOffer {
  id: string
  castingId?: string
  casting?: Casting
  senderId: string
  sender: User
  modelId: string
  model: User
  title: string
  description: string
  dates: {
    start: Date
    end: Date
  }
  pay: {
    amount: number
    currency: string
    type: "hourly" | "flat"
  }
  location: string
  status: "pending" | "accepted" | "declined" | "expired"
  expiresAt: Date
  createdAt: Date
}

export interface Post {
  id: string
  userId: string
  user: User
  type: "photo" | "video" | "carousel"
  media: string[]
  caption: string
  likes: number
  comments: number
  bookmarked: boolean
  liked: boolean
  createdAt: Date
  tags?: string[]
}

export interface UserLimits {
  userId: string
  weeklyApplications: number
  weeklyApplicationsMax: number
  weekStartDate: Date
  castingSubmissions: Record<string, number> // castingId -> count
}

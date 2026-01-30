import { z } from "zod"

// Auth validations
export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["model", "brand", "agency", "client"]),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(/^[a-zA-Z0-9_]+$/, "Username can only contain letters, numbers, and underscores"),
  displayName: z.string().min(1, "Display name is required").max(100),
})

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
})

// AvailabilityStatus enum
export const availabilityStatusEnum = z.enum(["AVAILABLE", "HOLD", "BOOKED"])
export type AvailabilityStatus = z.infer<typeof availabilityStatusEnum>

// Profile validations
export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(40).optional(),
  bio: z.string().max(160).optional(),
  locationCity: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
})

export const updateModelProfileSchema = z.object({
  heightCm: z.number().int().min(120).max(220).optional(),
  bustCm: z.number().int().min(50).max(200).optional(),
  waistCm: z.number().int().min(40).max(150).optional(),
  hipsCm: z.number().int().min(50).max(200).optional(),
  shoeSize: z.string().max(10).optional(),
  hair: z.string().max(50).optional(),
  eyes: z.string().max(50).optional(),
  languages: z.array(z.string()).optional(),
  availability: availabilityStatusEnum.optional(),
  details: z
    .object({
      dressSize: z.string().max(20).optional(),
      skinTone: z.string().max(50).optional(),
      experience: z.array(z.string().max(100)).optional(),
    })
    .optional(),
  measurements: z.record(z.unknown()).optional(), // JSON for additional measurements (legacy)
})

// Onboarding validations
export const onboardingCompleteSchema = z.object({
  displayName: z.string().min(1).max(100),
  bio: z.string().max(500).optional(),
  locationCity: z.string().max(100).optional(),
  avatarUrl: z.string().url().optional(),
  // Model-specific
  heightCm: z.number().int().min(100).max(250).optional(),
  bustCm: z.number().int().min(50).max(200).optional(),
  waistCm: z.number().int().min(40).max(150).optional(),
  hipsCm: z.number().int().min(50).max(200).optional(),
  shoeSize: z.string().max(10).optional(),
  hair: z.string().max(50).optional(),
  eyes: z.string().max(50).optional(),
  // Brand/Agency
  companyName: z.string().max(200).optional(),
  website: z.string().url().optional(),
})

// Casting validations
export const createCastingSchema = z.object({
  title: z.string().min(1, "Title is required").max(200),
  type: z.enum(["RUNWAY", "CAMPAIGN", "EDITORIAL", "EVENT", "OTHER"]),
  description: z.string().max(5000).optional(),
  location: z.string().max(200).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  payMin: z.number().int().min(0).optional(),
  payMax: z.number().int().min(0).optional(),
  deadline: z.string().datetime().optional(),
  verifiedOnly: z.boolean().optional(),
  requireDigitalTwin: z.boolean().optional(),
  maxSubmissionsPerAgency: z.number().int().min(1).max(100).optional(),
  requirements: z
    .object({
      minHeightCm: z.number().int().min(100).max(250).optional(),
      maxHeightCm: z.number().int().min(100).max(250).optional(),
      tags: z.array(z.string()).optional(),
      notes: z.string().max(1000).optional(),
    })
    .optional(),
})

export const updateCastingSchema = createCastingSchema.partial()

// Submission validations
export const applyToCastingSchema = z.object({
  note: z.string().max(1000).optional(),
  portfolioUrls: z.array(z.string().url()).max(10).optional(),
})

export const submitModelsToCastingSchema = z.object({
  modelIds: z.array(z.string().uuid()).min(1).max(50),
  note: z.string().max(1000).optional(),
})

export const updateSubmissionStatusSchema = z.object({
  status: z.enum(["SHORTLISTED", "OFFERED", "REJECTED"]),
  note: z.string().max(1000).optional(),
})

// Message validations
export const sendMessageSchema = z.object({
  body: z.string().min(1, "Message cannot be empty").max(5000),
  attachmentUrl: z.string().url().optional(),
})

// Media validations
export const mediaPresignSchema = z.object({
  type: z.enum(["AVATAR", "PORTFOLIO", "POLAROID", "DOCUMENT", "TWIN_INPUT", "TWIN_OUTPUT"]),
  filename: z.string().min(1).max(255),
  contentType: z.string().regex(/^(image|video|application)\/.+$/),
})

export const mediaConfirmSchema = z.object({
  url: z.string().url(),
  type: z.enum(["AVATAR", "PORTFOLIO", "POLAROID", "DOCUMENT", "TWIN_INPUT", "TWIN_OUTPUT"]),
  meta: z.record(z.unknown()).optional(),
})

// Settings validations (maps to UserSettings: pushNotifs, emailNotifs, darkMode, privacyMode)
export const updateSettingsSchema = z.object({
  darkMode: z.boolean().optional(),
  pushNotifs: z.boolean().optional(),
  emailNotifs: z.boolean().optional(),
  privacyMode: z.enum(["public", "verified_only", "private"]).optional(),
  notifications: z
    .object({
      email: z.boolean().optional(),
      push: z.boolean().optional(),
      castingInvites: z.boolean().optional(),
      messages: z.boolean().optional(),
      offers: z.boolean().optional(),
    })
    .optional(),
  privacy: z
    .object({
      profileVisibility: z.enum(["public", "verified_only", "private"]).optional(),
      showMeasurements: z.boolean().optional(),
      showLocation: z.boolean().optional(),
    })
    .optional(),
})

// Digital Twin validations
export const startDigitalTwinSchema = z.object({
  inputType: z.enum(["photos", "video", "lidar"]).optional(),
})

export const twinStatusEnum = z.enum(["NONE", "PENDING", "PROCESSING", "READY", "FAILED"])
export type TwinStatus = z.infer<typeof twinStatusEnum>

export const uploadCompleteSchema = z.object({
  inputUrls: z.array(z.string().url()).min(1).max(20),
})

// Helper function to validate request body
export async function validateBody<T>(
  request: Request,
  schema: z.ZodSchema<T>,
): Promise<{ success: true; data: T } | { success: false; error: string }> {
  try {
    const body = await request.json()
    const result = schema.safeParse(body)

    if (!result.success) {
      const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
      return { success: false, error: errors }
    }

    return { success: true, data: result.data }
  } catch {
    return { success: false, error: "Invalid JSON body" }
  }
}

// Helper function to validate query params
export function validateQuery<T>(
  searchParams: URLSearchParams,
  schema: z.ZodSchema<T>,
): { success: true; data: T } | { success: false; error: string } {
  const params: Record<string, string> = {}
  searchParams.forEach((value, key) => {
    params[key] = value
  })

  const result = schema.safeParse(params)

  if (!result.success) {
    const errors = result.error.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join(", ")
    return { success: false, error: errors }
  }

  return { success: true, data: result.data }
}

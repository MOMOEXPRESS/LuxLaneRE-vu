import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    // Update base profile fields
    if (body.displayName || body.bio || body.location) {
      await db`
        UPDATE users SET
          display_name = COALESCE(${body.displayName}, display_name),
          bio = COALESCE(${body.bio}, bio),
          location = COALESCE(${body.location}, location),
          updated_at = NOW()
        WHERE id = ${user.id}
      `
    }

    // Update role-specific profile
    if (user.role === "model" && body.modelProfile) {
      const mp = body.modelProfile
      await db`
        UPDATE model_profiles SET
          height_cm = COALESCE(${mp.heightCm}, height_cm),
          bust_cm = COALESCE(${mp.bustCm}, bust_cm),
          waist_cm = COALESCE(${mp.waistCm}, waist_cm),
          hips_cm = COALESCE(${mp.hipsCm}, hips_cm),
          shoe_size = COALESCE(${mp.shoeSize}, shoe_size),
          eye_color = COALESCE(${mp.eyeColor}, eye_color),
          hair_color = COALESCE(${mp.hairColor}, hair_color),
          date_of_birth = COALESCE(${mp.dateOfBirth}, date_of_birth),
          gender = COALESCE(${mp.gender}, gender),
          experience_tags = COALESCE(${mp.experienceTags}, experience_tags),
          updated_at = NOW()
        WHERE user_id = ${user.id}
      `
    } else if (user.role === "agency" && body.agencyProfile) {
      const ap = body.agencyProfile
      await db`
        UPDATE agency_profiles SET
          agency_name = COALESCE(${ap.agencyName}, agency_name),
          founded_year = COALESCE(${ap.foundedYear}, founded_year),
          specialties = COALESCE(${ap.specialties}, specialties),
          updated_at = NOW()
        WHERE user_id = ${user.id}
      `
    } else if (user.role === "brand" && body.brandProfile) {
      const bp = body.brandProfile
      await db`
        UPDATE brand_profiles SET
          brand_name = COALESCE(${bp.brandName}, brand_name),
          industry = COALESCE(${bp.industry}, industry),
          company_size = COALESCE(${bp.companySize}, company_size),
          updated_at = NOW()
        WHERE user_id = ${user.id}
      `
    }

    // Mark onboarding as complete
    await db`
      UPDATE users SET onboarding_complete = true, updated_at = NOW() WHERE id = ${user.id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Complete onboarding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

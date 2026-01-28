import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { validateBody, updateModelProfileSchema } from "@/lib/validations"
import { v4 as uuidv4 } from "uuid"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const userCheck = await db`
      SELECT role FROM users WHERE id = ${user.id}
    `
    if (userCheck.length === 0) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (userCheck[0].role !== "model") {
      return NextResponse.json({ error: "Only models can update model profile" }, { status: 403 })
    }

    const validation = await validateBody(request, updateModelProfileSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const { heightCm, bustCm, waistCm, hipsCm, shoeSize, hair, eyes, languages, availability } = validation.data

    const existing = await db`
      SELECT user_id FROM model_profiles WHERE user_id = ${user.id}
    `

    if (existing.length === 0) {
      // Create new model profile
      await db`
        INSERT INTO model_profiles (id, user_id, languages)
        VALUES (${uuidv4()}, ${user.id}, ${JSON.stringify(languages || [])})
      `
    }

    await db`
      UPDATE model_profiles SET
        height_cm = COALESCE(${heightCm}, height_cm),
        bust_cm = COALESCE(${bustCm}, bust_cm),
        waist_cm = COALESCE(${waistCm}, waist_cm),
        hips_cm = COALESCE(${hipsCm}, hips_cm),
        shoe_size = COALESCE(${shoeSize}, shoe_size),
        hair_color = COALESCE(${hair}, hair_color),
        eye_color = COALESCE(${eyes}, eye_color),
        languages = COALESCE(${languages ? JSON.stringify(languages) : null}, languages),
        availability = COALESCE(${availability}, availability),
        updated_at = NOW()
      WHERE user_id = ${user.id}
      RETURNING *
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update model profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

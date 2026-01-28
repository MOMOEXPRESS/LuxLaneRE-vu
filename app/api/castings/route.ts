import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"
import { v4 as uuidv4 } from "uuid"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status") || "active"
    const query = searchParams.get("query")
    const tags = searchParams.get("tags")?.split(",").filter(Boolean)
    const creatorId = searchParams.get("creatorId")
    const limit = Number(searchParams.get("limit")) || 20
    const offset = Number(searchParams.get("offset")) || 0

    let castings

    if (creatorId) {
      // Get castings by specific creator
      castings = await db`
        SELECT c.*, u.display_name as creator_name, u.avatar_url as creator_avatar, u.username as creator_username
        FROM castings c
        JOIN users u ON c.creator_id = u.id
        WHERE c.creator_id = ${creatorId}
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else if (query) {
      // Search castings
      castings = await db`
        SELECT c.*, u.display_name as creator_name, u.avatar_url as creator_avatar, u.username as creator_username
        FROM castings c
        JOIN users u ON c.creator_id = u.id
        WHERE c.status = ${status}
          AND (c.title ILIKE ${"%" + query + "%"} OR c.description ILIKE ${"%" + query + "%"})
        ORDER BY c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    } else {
      // Get castings by status
      castings = await db`
        SELECT c.*, u.display_name as creator_name, u.avatar_url as creator_avatar, u.username as creator_username
        FROM castings c
        JOIN users u ON c.creator_id = u.id
        WHERE c.status = ${status}
        ORDER BY c.deadline ASC NULLS LAST, c.created_at DESC
        LIMIT ${limit} OFFSET ${offset}
      `
    }

    // Get requirements for each casting
    const castingIds = castings.map((c: { id: string }) => c.id)
    let requirements: Record<string, unknown>[] = []
    if (castingIds.length > 0) {
      requirements = await db`
        SELECT * FROM casting_requirements WHERE casting_id = ANY(${castingIds})
      `
    }

    // Attach requirements to castings
    const castingsWithRequirements = castings.map((c: Record<string, unknown>) => ({
      ...c,
      requirements: requirements.find((r: Record<string, unknown>) => r.casting_id === c.id) || null,
    }))

    return NextResponse.json({ castings: castingsWithRequirements })
  } catch (error) {
    console.error("Get castings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Only brands and agencies can create castings
    if (!["brand", "agency"].includes(user.role)) {
      return NextResponse.json({ error: "Only brands and agencies can create castings" }, { status: 403 })
    }

    const body = await request.json()
    const {
      title,
      description,
      type,
      location,
      city,
      country,
      payMin,
      payMax,
      payCurrency,
      deadline,
      shootDateStart,
      shootDateEnd,
      tags,
      requirements,
    } = body

    if (!title || !type) {
      return NextResponse.json({ error: "Title and type are required" }, { status: 400 })
    }

    const castingId = uuidv4()

    // Create casting
    await db`
      INSERT INTO castings (
        id, creator_id, title, description, type, location, city, country,
        pay_min, pay_max, pay_currency, deadline, shoot_date_start, shoot_date_end, tags, status
      )
      VALUES (
        ${castingId}, ${user.id}, ${title}, ${description || null}, ${type}, 
        ${location || null}, ${city || null}, ${country || null},
        ${payMin || null}, ${payMax || null}, ${payCurrency || "USD"},
        ${deadline || null}, ${shootDateStart || null}, ${shootDateEnd || null},
        ${tags || []}, 'draft'
      )
    `

    // Create requirements if provided
    if (requirements) {
      await db`
        INSERT INTO casting_requirements (
          id, casting_id, height_min, height_max, age_min, age_max,
          gender, eye_colors, hair_colors, experience_tags, verified_only, digital_twin_required
        )
        VALUES (
          ${uuidv4()}, ${castingId}, 
          ${requirements.heightMin || null}, ${requirements.heightMax || null},
          ${requirements.ageMin || null}, ${requirements.ageMax || null},
          ${requirements.gender || null}, ${requirements.eyeColors || []},
          ${requirements.hairColors || []}, ${requirements.experienceTags || []},
          ${requirements.verifiedOnly || false}, ${requirements.digitalTwinRequired || false}
        )
      `
    }

    return NextResponse.json({
      success: true,
      casting: { id: castingId },
    })
  } catch (error) {
    console.error("Create casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

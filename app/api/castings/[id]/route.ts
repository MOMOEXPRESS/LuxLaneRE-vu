import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    // Get casting with creator info
    const castings = await db`
      SELECT c.*, u.display_name as creator_name, u.avatar_url as creator_avatar, 
             u.username as creator_username, u.role as creator_role
      FROM castings c
      JOIN users u ON c.creator_id = u.id
      WHERE c.id = ${id}
    `

    if (castings.length === 0) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    const casting = castings[0]

    // Get requirements
    const requirements = await db`
      SELECT * FROM casting_requirements WHERE casting_id = ${id}
    `

    // Get submission count
    const submissionCount = await db`
      SELECT COUNT(*) as count FROM submissions WHERE casting_id = ${id}
    `

    // Check if current user has applied (if model)
    let userSubmission = null
    if (user && user.role === "model") {
      const submissions = await db`
        SELECT id, status, created_at FROM submissions 
        WHERE casting_id = ${id} AND model_id = ${user.id}
      `
      if (submissions.length > 0) {
        userSubmission = submissions[0]
      }
    }

    return NextResponse.json({
      casting: {
        ...casting,
        requirements: requirements[0] || null,
        submissionCount: Number(submissionCount[0]?.count || 0),
        userSubmission,
      },
    })
  } catch (error) {
    console.error("Get casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    // Verify ownership
    const casting = await db`
      SELECT creator_id FROM castings WHERE id = ${id}
    `

    if (casting.length === 0) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting[0].creator_id !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    const body = await request.json()
    const { title, description, type, location, city, country, payMin, payMax, deadline, tags } = body

    await db`
      UPDATE castings SET
        title = COALESCE(${title}, title),
        description = COALESCE(${description}, description),
        type = COALESCE(${type}, type),
        location = COALESCE(${location}, location),
        city = COALESCE(${city}, city),
        country = COALESCE(${country}, country),
        pay_min = COALESCE(${payMin}, pay_min),
        pay_max = COALESCE(${payMax}, pay_max),
        deadline = COALESCE(${deadline}, deadline),
        tags = COALESCE(${tags}, tags),
        updated_at = NOW()
      WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

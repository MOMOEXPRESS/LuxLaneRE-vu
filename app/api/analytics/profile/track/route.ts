import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// POST — track a profile view
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    const { profileId, source } = body as { profileId: string; source?: string }

    if (!profileId) {
      return NextResponse.json({ error: "profileId required" }, { status: 400 })
    }

    // Don't track self-views
    if (user?.id === profileId) {
      return NextResponse.json({ tracked: false })
    }

    await prisma.profileView.create({
      data: {
        profileId,
        viewerId: user?.id || null,
        source: source || "direct",
      },
    })

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error("Track profile view error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

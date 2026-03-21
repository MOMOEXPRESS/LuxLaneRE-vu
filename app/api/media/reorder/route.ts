import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// POST — reorder media assets (portfolio images)
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { orderedIds } = body as { orderedIds: string[] }

    if (!orderedIds || !Array.isArray(orderedIds) || orderedIds.length === 0) {
      return NextResponse.json({ error: "orderedIds array is required" }, { status: 400 })
    }

    // Verify all assets belong to this user
    const assets = await prisma.mediaAsset.findMany({
      where: { id: { in: orderedIds }, ownerId: user.id },
    })

    if (assets.length !== orderedIds.length) {
      return NextResponse.json({ error: "Some media assets not found or not owned by you" }, { status: 400 })
    }

    // Update sort order for each
    const updates = orderedIds.map((id: string, index: number) =>
      prisma.mediaAsset.update({
        where: { id },
        data: { sortOrder: index },
      })
    )

    await Promise.all(updates)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reorder media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

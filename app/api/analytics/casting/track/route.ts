import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// POST — track a casting view
export async function POST(request: Request) {
  try {
    const user = await getCurrentUser()
    const body = await request.json()
    const { castingId } = body as { castingId: string }

    if (!castingId) {
      return NextResponse.json({ error: "castingId required" }, { status: 400 })
    }

    // Verify casting exists
    const casting = await prisma.casting.findUnique({ where: { id: castingId } })
    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    // Don't track creator's own views
    if (user?.id === casting.createdBy) {
      return NextResponse.json({ tracked: false })
    }

    await prisma.castingView.create({
      data: {
        castingId,
        viewerId: user?.id || null,
      },
    })

    return NextResponse.json({ tracked: true })
  } catch (error) {
    console.error("Track casting view error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

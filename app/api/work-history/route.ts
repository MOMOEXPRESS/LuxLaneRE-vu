import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET /api/work-history?userId= — get work credits for a model
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")
    const user = await getCurrentUser()

    const targetId = userId || user?.id
    if (!targetId) {
      return NextResponse.json({ error: "userId required" }, { status: 400 })
    }

    const credits = await prisma.workCredit.findMany({
      where: { modelId: targetId },
      include: { confirmer: { include: { profile: true } } },
      orderBy: { year: "desc" },
    })

    return NextResponse.json({
      credits: credits.map((c) => ({
        id: c.id,
        brandName: c.brandName,
        projectTitle: c.projectTitle,
        role: c.role,
        photographer: c.photographer,
        year: c.year,
        type: c.type,
        imageUrl: c.imageUrl,
        confirmed: !!c.confirmedBy,
        confirmedBy: c.confirmer
          ? { id: c.confirmer.id, name: c.confirmer.profile?.displayName ?? c.confirmer.displayName }
          : null,
        createdAt: c.createdAt.toISOString(),
      })),
    })
  } catch (error) {
    console.error("Get work history error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST /api/work-history — add a work credit
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { brandName, projectTitle, role, photographer, year, type, imageUrl } = body

    if (!brandName || !projectTitle) {
      return NextResponse.json({ error: "brandName and projectTitle required" }, { status: 400 })
    }

    const credit = await prisma.workCredit.create({
      data: {
        modelId: user.id,
        brandName,
        projectTitle,
        role: role || null,
        photographer: photographer || null,
        year: year || new Date().getFullYear(),
        type: type || "campaign",
        imageUrl: imageUrl || null,
      },
    })

    return NextResponse.json({ credit }, { status: 201 })
  } catch (error) {
    console.error("Add work credit error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

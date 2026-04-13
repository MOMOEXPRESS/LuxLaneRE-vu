import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    const { searchParams } = new URL(request.url)
    const ownerId = searchParams.get("ownerId") || user?.id
    const type = searchParams.get("type")

    if (!ownerId) {
      return NextResponse.json({ error: "Not authenticated and no ownerId provided" }, { status: 401 })
    }

    const media = await prisma.mediaAsset.findMany({
      where: {
        ownerId,
        ...(type ? { type: type.toUpperCase() as never } : {}),
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ media })
  } catch (error) {
    console.error("Get media error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

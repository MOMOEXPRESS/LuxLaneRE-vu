import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const user = await getCurrentUser()

    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const casting = await prisma.casting.findUnique({
      where: { id },
      select: { createdBy: true },
    })

    if (!casting) {
      return NextResponse.json({ error: "Casting not found" }, { status: 404 })
    }

    if (casting.createdBy !== user.id) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    await prisma.casting.update({
      where: { id },
      data: { status: "CLOSED" },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Close casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

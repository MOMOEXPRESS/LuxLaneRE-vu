import { type NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
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

    await db`
      UPDATE castings SET status = 'closed', updated_at = NOW() WHERE id = ${id}
    `

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Close casting error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

// GET — fetch availability dates for a user (current user by default, or ?userId=xxx)
export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const targetUserId = searchParams.get("userId") || user.id
    const monthStr = searchParams.get("month") // "2026-03" format

    const where: Record<string, unknown> = { userId: targetUserId }

    if (monthStr) {
      const [year, month] = monthStr.split("-").map(Number)
      const start = new Date(year, month - 1, 1)
      const end = new Date(year, month, 0, 23, 59, 59) // Last day of month
      where.date = { gte: start, lte: end }
    }

    const dates = await prisma.availabilityDate.findMany({
      where,
      orderBy: { date: "asc" },
    })

    return NextResponse.json({
      dates: dates.map((d) => ({
        id: d.id,
        date: d.date.toISOString().split("T")[0], // "2026-03-20"
        status: d.status,
      })),
    })
  } catch (error) {
    console.error("Get availability error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST — set availability for specific dates
export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }
    if (user.role !== "model") {
      return NextResponse.json({ error: "Only models can set availability" }, { status: 403 })
    }

    const body = await request.json()
    const { dates } = body as { dates: Array<{ date: string; status: string }> }

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: "dates array is required" }, { status: 400 })
    }

    const validStatuses = ["AVAILABLE", "HOLD", "BOOKED"]

    // Upsert each date
    const operations = dates.map((d) => {
      const dateObj = new Date(d.date + "T00:00:00.000Z")
      const status = validStatuses.includes(d.status.toUpperCase()) ? d.status.toUpperCase() : "AVAILABLE"
      return prisma.availabilityDate.upsert({
        where: { userId_date: { userId: user.id, date: dateObj } },
        create: { userId: user.id, date: dateObj, status },
        update: { status },
      })
    })

    await Promise.all(operations)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Set availability error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE — remove availability entries (marks them as not set / free)
export async function DELETE(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()
    const { dates } = body as { dates: string[] }

    if (!dates || !Array.isArray(dates)) {
      return NextResponse.json({ error: "dates array is required" }, { status: 400 })
    }

    await prisma.availabilityDate.deleteMany({
      where: {
        userId: user.id,
        date: { in: dates.map((d) => new Date(d + "T00:00:00.000Z")) },
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete availability error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

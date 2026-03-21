import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function GET() {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const bookings = await prisma.directBooking.findMany({
      where: {
        OR: [{ brandId: user.id }, { modelId: user.id }],
      },
      include: {
        brand: { include: { profile: true } },
        model: { include: { profile: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ bookings })
  } catch (error) {
    console.error("Get bookings error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    if (user.role !== "brand" && user.role !== "client") {
      return NextResponse.json(
        { error: "Only brands and clients can create direct bookings" },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { modelId, title, description, location, startDate, endDate, payAmount } = body

    if (!modelId || !title) {
      return NextResponse.json({ error: "modelId and title are required" }, { status: 400 })
    }

    // Verify the model exists
    const model = await prisma.user.findUnique({ where: { id: modelId } })
    if (!model) {
      return NextResponse.json({ error: "Model not found" }, { status: 404 })
    }

    const booking = await prisma.directBooking.create({
      data: {
        brandId: user.id,
        modelId,
        title,
        description: description || null,
        location: location || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        payAmount: payAmount || null,
      },
    })

    // Create notification for model
    await prisma.notification.create({
      data: {
        userId: modelId,
        type: "OFFER",
        payload: {
          title: "New booking request",
          message: `${user.username} wants to book you for "${title}"`,
          bookingId: booking.id,
        },
      },
    })

    return NextResponse.json({ success: true, booking })
  } catch (error) {
    console.error("Create booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

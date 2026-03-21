import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { id } = await params

    const booking = await prisma.directBooking.findUnique({ where: { id } })
    if (!booking) {
      return NextResponse.json({ error: "Booking not found" }, { status: 404 })
    }

    // Only the brand or the model involved can update
    if (booking.brandId !== user.id && booking.modelId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status } = body

    if (!status) {
      return NextResponse.json({ error: "status is required" }, { status: 400 })
    }

    const validStatuses = ["PENDING", "ACCEPTED", "DECLINED", "CONFIRMED", "COMPLETED", "CANCELLED"]
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 })
    }

    // Model can accept/decline; brand can confirm/cancel/complete
    if (booking.modelId === user.id && !["ACCEPTED", "DECLINED"].includes(status)) {
      return NextResponse.json({ error: "Models can only accept or decline" }, { status: 403 })
    }
    if (booking.brandId === user.id && !["CONFIRMED", "CANCELLED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Brands can only confirm, cancel, or complete" }, { status: 403 })
    }

    const updated = await prisma.directBooking.update({
      where: { id },
      data: { status },
    })

    // Notify the other party
    const notifyUserId = booking.brandId === user.id ? booking.modelId : booking.brandId
    await prisma.notification.create({
      data: {
        userId: notifyUserId,
        type: "OFFER",
        payload: {
          title: "Booking updated",
          message: `Booking "${booking.title}" has been ${status.toLowerCase()}`,
          bookingId: booking.id,
        },
      },
    })

    return NextResponse.json({ success: true, booking: updated })
  } catch (error) {
    console.error("Update booking error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

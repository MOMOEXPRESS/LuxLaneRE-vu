import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: applicationId } = await params
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const { action } = await request.json()
    if (!["accept", "reject"].includes(action)) {
      return NextResponse.json({ error: "action must be 'accept' or 'reject'" }, { status: 400 })
    }

    const application = await prisma.agencyApplication.findUnique({
      where: { id: applicationId },
    })
    if (!application) {
      return NextResponse.json({ error: "Application not found" }, { status: 404 })
    }

    // Agency accepts/rejects a model's application
    // OR model accepts/rejects an agency's invitation
    const isAgency = user.id === application.agencyId && user.role === "agency"
    const isModel = user.id === application.modelId && user.role === "model"

    if (!isAgency && !isModel) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 })
    }

    // Agency responding to a PENDING application from model
    // Model responding to an INVITED request from agency
    if (isAgency && application.status !== "PENDING") {
      if (application.status !== "PENDING") {
        return NextResponse.json({ error: "Application is not pending" }, { status: 400 })
      }
    }
    if (isModel && application.status !== "INVITED") {
      return NextResponse.json({ error: "No pending invitation" }, { status: 400 })
    }

    if (action === "accept") {
      // Add model to roster
      await prisma.modelProfile.update({
        where: { userId: application.modelId },
        data: { agencyId: application.agencyId },
      })
      await prisma.agencyApplication.update({
        where: { id: applicationId },
        data: { status: "ACCEPTED" },
      })

      // Notify the other party
      const notifyUserId = isAgency ? application.modelId : application.agencyId
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "SYSTEM",
          payload: {
            title: isAgency ? "Application Accepted" : "Invitation Accepted",
            body: isAgency
              ? "Your application to join the agency has been accepted!"
              : "A model has accepted your invitation",
            relatedId: applicationId,
            relatedType: "agency_application",
          },
        },
      })
    } else {
      await prisma.agencyApplication.update({
        where: { id: applicationId },
        data: { status: "REJECTED" },
      })

      const notifyUserId = isAgency ? application.modelId : application.agencyId
      await prisma.notification.create({
        data: {
          userId: notifyUserId,
          type: "SYSTEM",
          payload: {
            title: isAgency ? "Application Declined" : "Invitation Declined",
            body: isAgency
              ? "Your application to join the agency was declined"
              : "A model has declined your invitation",
            relatedId: applicationId,
            relatedType: "agency_application",
          },
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Agency application respond error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

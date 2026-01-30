import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"
import { validateBody, updateModelProfileSchema } from "@/lib/validations"

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })
    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }
    if (dbUser.role !== "MODEL") {
      return NextResponse.json({ error: "Only models can update model profile" }, { status: 403 })
    }

    const validation = await validateBody(request, updateModelProfileSchema)
    if (!validation.success) {
      return NextResponse.json({ error: validation.error }, { status: 400 })
    }

    const {
      heightCm,
      bustCm,
      waistCm,
      hipsCm,
      shoeSize,
      hair,
      eyes,
      languages,
      availability,
      details,
    } = validation.data

    const existing = await prisma.modelProfile.findUnique({
      where: { userId: user.id },
      select: { details: true },
    })

    const currentDetails = (existing?.details as Record<string, unknown> | null) ?? {}
    const mergedDetails =
      details != null
        ? {
            ...currentDetails,
            ...(details.dressSize !== undefined && { dressSize: details.dressSize }),
            ...(details.skinTone !== undefined && { skinTone: details.skinTone }),
            ...(details.experience !== undefined && { experience: details.experience }),
          }
        : undefined

    await prisma.modelProfile.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        ...(heightCm != null && { heightCm }),
        ...(bustCm != null && { bustCm }),
        ...(waistCm != null && { waistCm }),
        ...(hipsCm != null && { hipsCm }),
        ...(shoeSize != null && { shoeSize }),
        ...(hair != null && { hair }),
        ...(eyes != null && { eyes }),
        ...(languages != null && { languages }),
        ...(availability != null && { availability }),
        ...(mergedDetails != null && { details: mergedDetails }),
      },
      update: {
        ...(heightCm != null && { heightCm }),
        ...(bustCm != null && { bustCm }),
        ...(waistCm != null && { waistCm }),
        ...(hipsCm != null && { hipsCm }),
        ...(shoeSize != null && { shoeSize }),
        ...(hair != null && { hair }),
        ...(eyes != null && { eyes }),
        ...(languages != null && { languages }),
        ...(availability != null && { availability }),
        ...(mergedDetails != null && { details: mergedDetails }),
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update model profile error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

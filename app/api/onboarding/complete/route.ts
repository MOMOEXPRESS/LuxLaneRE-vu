import { type NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getCurrentUser } from "@/lib/auth"

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 })
    }

    const body = await request.json()

    // Update or create base profile
    if (body.displayName || body.bio || body.location) {
      await prisma.profile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          displayName: body.displayName || user.username,
          bio: body.bio || null,
          location: body.location || null,
        },
        update: {
          ...(body.displayName !== undefined && { displayName: body.displayName }),
          ...(body.bio !== undefined && { bio: body.bio }),
          ...(body.location !== undefined && { location: body.location }),
        },
      })
    }

    // Update role-specific profile
    if (user.role === "model" && body.modelProfile) {
      const mp = body.modelProfile
      await prisma.modelProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          heightCm: mp.heightCm || null,
          bustCm: mp.bustCm || null,
          waistCm: mp.waistCm || null,
          hipsCm: mp.hipsCm || null,
          shoeSize: mp.shoeSize || null,
          eyes: mp.eyeColor || null,
          hair: mp.hairColor || null,
          languages: mp.languages || [],
        },
        update: {
          ...(mp.heightCm !== undefined && { heightCm: mp.heightCm }),
          ...(mp.bustCm !== undefined && { bustCm: mp.bustCm }),
          ...(mp.waistCm !== undefined && { waistCm: mp.waistCm }),
          ...(mp.hipsCm !== undefined && { hipsCm: mp.hipsCm }),
          ...(mp.shoeSize !== undefined && { shoeSize: mp.shoeSize }),
          ...(mp.eyeColor !== undefined && { eyes: mp.eyeColor }),
          ...(mp.hairColor !== undefined && { hair: mp.hairColor }),
          ...(mp.languages !== undefined && { languages: mp.languages }),
        },
      })

      // Store experience tags and social links in the details JSON field
      if (mp.experienceTags || mp.socialLinks) {
        await prisma.modelProfile.update({
          where: { userId: user.id },
          data: {
            details: {
              experienceTags: mp.experienceTags || [],
              socialLinks: mp.socialLinks || {},
            },
          },
        })
      }
    } else if (user.role === "agency" && body.agencyProfile) {
      const ap = body.agencyProfile
      await prisma.agencyProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          agencyName: ap.agencyName || user.username,
          website: ap.website || null,
        },
        update: {
          ...(ap.agencyName !== undefined && { agencyName: ap.agencyName }),
          ...(ap.website !== undefined && { website: ap.website }),
        },
      })
    } else if (user.role === "brand" && body.brandProfile) {
      const bp = body.brandProfile
      await prisma.brandProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          brandName: bp.brandName || user.username,
          website: bp.website || null,
        },
        update: {
          ...(bp.brandName !== undefined && { brandName: bp.brandName }),
          ...(bp.website !== undefined && { website: bp.website }),
        },
      })
    } else if (user.role === "client" && body.clientProfile) {
      const cp = body.clientProfile
      await prisma.clientProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          clientName: cp.clientName || user.username,
          website: cp.website || null,
          industry: cp.industry || null,
        },
        update: {
          ...(cp.clientName !== undefined && { clientName: cp.clientName }),
          ...(cp.website !== undefined && { website: cp.website }),
          ...(cp.industry !== undefined && { industry: cp.industry }),
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Complete onboarding error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

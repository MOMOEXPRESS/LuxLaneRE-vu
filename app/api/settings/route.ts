import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { verifyAccessToken } from "@/lib/auth"
import { validateBody, updateSettingsSchema } from "@/lib/validations"

async function getUserId(): Promise<string | null> {
  const cookieStore = await cookies()
  const accessToken = cookieStore.get("access_token")?.value
  if (!accessToken) return null
  const payload = await verifyAccessToken(accessToken)
  return payload?.userId ?? null
}

export async function GET() {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    let settings = await prisma.userSettings.findUnique({
      where: { userId },
    })
    if (!settings) {
      settings = await prisma.userSettings.create({
        data: { userId },
      })
    }
    return NextResponse.json({
      userId: settings.userId,
      darkMode: settings.darkMode,
      pushNotifs: settings.pushNotifs,
      emailNotifs: settings.emailNotifs,
      privacyMode: settings.privacyMode,
      notifications: {
        push: settings.pushNotifs,
        email: settings.emailNotifs,
      },
      privacy: { profileVisibility: settings.privacyMode },
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to get settings:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const userId = await getUserId()
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const validation = await validateBody(request, updateSettingsSchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { darkMode, pushNotifs, emailNotifs, privacyMode, notifications, privacy } = validation.data

  const pushNotifsVal = pushNotifs ?? notifications?.push
  const emailNotifsVal = emailNotifs ?? notifications?.email
  const privacyModeVal = privacyMode ?? privacy?.profileVisibility

  try {
    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        darkMode: darkMode ?? true,
        pushNotifs: pushNotifsVal ?? true,
        emailNotifs: emailNotifsVal ?? true,
        privacyMode: privacyModeVal ?? "public",
      },
      update: {
        ...(darkMode !== undefined && { darkMode }),
        ...(pushNotifsVal !== undefined && { pushNotifs: pushNotifsVal }),
        ...(emailNotifsVal !== undefined && { emailNotifs: emailNotifsVal }),
        ...(privacyModeVal !== undefined && { privacyMode: privacyModeVal }),
      },
    })
    return NextResponse.json({
      userId: settings.userId,
      darkMode: settings.darkMode,
      pushNotifs: settings.pushNotifs,
      emailNotifs: settings.emailNotifs,
      privacyMode: settings.privacyMode,
      notifications: {
        push: settings.pushNotifs,
        email: settings.emailNotifs,
      },
      privacy: { profileVisibility: settings.privacyMode },
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

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
    const notifs = (settings.notifications as Record<string, unknown>) ?? { push: true, email: true }
    const priv = (settings.privacy as Record<string, unknown>) ?? { mode: "public" }
    return NextResponse.json({
      userId: settings.userId,
      darkMode: settings.darkMode,
      pushNotifs: notifs.push ?? true,
      emailNotifs: notifs.email ?? true,
      privacyMode: priv.mode ?? priv.profileVisibility ?? "public",
      notifications: notifs,
      privacy: priv,
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

  // Build notification and privacy JSON objects
  const notifsUpdate: Record<string, unknown> = {}
  if (pushNotifs !== undefined || notifications?.push !== undefined) notifsUpdate.push = pushNotifs ?? notifications?.push
  if (emailNotifs !== undefined || notifications?.email !== undefined) notifsUpdate.email = emailNotifs ?? notifications?.email
  if (notifications?.castingInvites !== undefined) notifsUpdate.castingInvites = notifications.castingInvites
  if (notifications?.messages !== undefined) notifsUpdate.messages = notifications.messages
  if (notifications?.offers !== undefined) notifsUpdate.offers = notifications.offers

  const privacyUpdate: Record<string, unknown> = {}
  if (privacyMode !== undefined || privacy?.profileVisibility !== undefined) privacyUpdate.mode = privacyMode ?? privacy?.profileVisibility
  if (privacy?.showMeasurements !== undefined) privacyUpdate.showMeasurements = privacy.showMeasurements
  if (privacy?.showLocation !== undefined) privacyUpdate.showLocation = privacy.showLocation

  try {
    // Get existing settings to merge JSON fields
    const existing = await prisma.userSettings.findUnique({ where: { userId } })
    const existingNotifs = (existing?.notifications as Record<string, unknown>) ?? { push: true, email: true }
    const existingPrivacy = (existing?.privacy as Record<string, unknown>) ?? { mode: "public" }

    const mergedNotifs = { ...existingNotifs, ...notifsUpdate }
    const mergedPrivacy = { ...existingPrivacy, ...privacyUpdate }

    const settings = await prisma.userSettings.upsert({
      where: { userId },
      create: {
        userId,
        darkMode: darkMode ?? true,
        notifications: Object.keys(notifsUpdate).length > 0 ? mergedNotifs : { push: true, email: true },
        privacy: Object.keys(privacyUpdate).length > 0 ? mergedPrivacy : { mode: "public" },
      },
      update: {
        ...(darkMode !== undefined && { darkMode }),
        ...(Object.keys(notifsUpdate).length > 0 && { notifications: mergedNotifs }),
        ...(Object.keys(privacyUpdate).length > 0 && { privacy: mergedPrivacy }),
      },
    })
    const notifs = (settings.notifications as Record<string, unknown>) ?? { push: true, email: true }
    const priv = (settings.privacy as Record<string, unknown>) ?? { mode: "public" }
    return NextResponse.json({
      userId: settings.userId,
      darkMode: settings.darkMode,
      pushNotifs: notifs.push ?? true,
      emailNotifs: notifs.email ?? true,
      privacyMode: priv.mode ?? "public",
      notifications: notifs,
      privacy: priv,
      createdAt: settings.createdAt.toISOString(),
      updatedAt: settings.updatedAt.toISOString(),
    })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

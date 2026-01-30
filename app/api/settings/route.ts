import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { sql } from "@/lib/db"
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
    let settingsResult = await sql`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `
    
    if (settingsResult.length === 0) {
      // Create default settings
      await sql`
        INSERT INTO user_settings (user_id, dark_mode, push_notifs, email_notifs, privacy_mode)
        VALUES (${userId}, true, true, true, 'public')
      `
      settingsResult = await sql`
        SELECT * FROM user_settings WHERE user_id = ${userId}
      `
    }
    
    const settings = settingsResult[0]
    return NextResponse.json({
      userId: settings.user_id,
      darkMode: settings.dark_mode,
      pushNotifs: settings.push_notifs,
      emailNotifs: settings.email_notifs,
      privacyMode: settings.privacy_mode,
      notifications: {
        push: settings.push_notifs,
        email: settings.email_notifs,
      },
      privacy: { profileVisibility: settings.privacy_mode },
      createdAt: settings.created_at ? new Date(settings.created_at).toISOString() : new Date().toISOString(),
      updatedAt: settings.updated_at ? new Date(settings.updated_at).toISOString() : new Date().toISOString(),
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
    // Upsert settings
    await sql`
      INSERT INTO user_settings (user_id, dark_mode, push_notifs, email_notifs, privacy_mode)
      VALUES (
        ${userId},
        ${darkMode ?? true},
        ${pushNotifsVal ?? true},
        ${emailNotifsVal ?? true},
        ${privacyModeVal ?? 'public'}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        dark_mode = COALESCE(${darkMode}, user_settings.dark_mode),
        push_notifs = COALESCE(${pushNotifsVal}, user_settings.push_notifs),
        email_notifs = COALESCE(${emailNotifsVal}, user_settings.email_notifs),
        privacy_mode = COALESCE(${privacyModeVal}, user_settings.privacy_mode),
        updated_at = NOW()
    `
    
    const settingsResult = await sql`
      SELECT * FROM user_settings WHERE user_id = ${userId}
    `
    const settings = settingsResult[0]
    
    return NextResponse.json({
      userId: settings.user_id,
      darkMode: settings.dark_mode,
      pushNotifs: settings.push_notifs,
      emailNotifs: settings.email_notifs,
      privacyMode: settings.privacy_mode,
      notifications: {
        push: settings.push_notifs,
        email: settings.email_notifs,
      },
      privacy: { profileVisibility: settings.privacy_mode },
      createdAt: settings.created_at ? new Date(settings.created_at).toISOString() : new Date().toISOString(),
      updatedAt: settings.updated_at ? new Date(settings.updated_at).toISOString() : new Date().toISOString(),
    })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

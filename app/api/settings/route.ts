import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import { verifyAccessToken, getAuthHeader } from "@/lib/auth"
import { validateBody, updateSettingsSchema } from "@/lib/validations"

export async function GET(request: Request) {
  const token = getAuthHeader(request)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  try {
    // Upsert to ensure settings always exist (matches NestJS pattern)
    const result = await db`
      INSERT INTO user_settings (user_id, dark_mode, notifications, privacy)
      VALUES (${payload.userId}, true, '{}'::jsonb, '{}'::jsonb)
      ON CONFLICT (user_id) DO UPDATE SET user_id = user_settings.user_id
      RETURNING user_id, dark_mode, notifications, privacy, created_at, updated_at
    `

    const settings = result[0]
    return NextResponse.json({
      userId: settings.user_id,
      darkMode: settings.dark_mode,
      notifications: settings.notifications,
      privacy: settings.privacy,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error("Failed to get settings:", error)
    return NextResponse.json({ error: "Failed to get settings" }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  const token = getAuthHeader(request)
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = verifyAccessToken(token)
  if (!payload) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 })
  }

  const validation = await validateBody(request, updateSettingsSchema)
  if (!validation.success) {
    return NextResponse.json({ error: validation.error }, { status: 400 })
  }

  const { darkMode, notifications, privacy } = validation.data

  try {
    // Build dynamic update matching NestJS conditional spread pattern
    const result = await db`
      INSERT INTO user_settings (user_id, dark_mode, notifications, privacy)
      VALUES (
        ${payload.userId},
        ${darkMode ?? true},
        ${JSON.stringify(notifications ?? {})}::jsonb,
        ${JSON.stringify(privacy ?? {})}::jsonb
      )
      ON CONFLICT (user_id) DO UPDATE SET
        dark_mode = CASE 
          WHEN ${darkMode !== undefined} THEN ${darkMode ?? true}
          ELSE user_settings.dark_mode 
        END,
        notifications = CASE 
          WHEN ${notifications !== undefined} THEN ${JSON.stringify(notifications ?? {})}::jsonb
          ELSE user_settings.notifications 
        END,
        privacy = CASE 
          WHEN ${privacy !== undefined} THEN ${JSON.stringify(privacy ?? {})}::jsonb
          ELSE user_settings.privacy 
        END,
        updated_at = NOW()
      RETURNING user_id, dark_mode, notifications, privacy, created_at, updated_at
    `

    const settings = result[0]
    return NextResponse.json({
      userId: settings.user_id,
      darkMode: settings.dark_mode,
      notifications: settings.notifications,
      privacy: settings.privacy,
      createdAt: settings.created_at,
      updatedAt: settings.updated_at,
    })
  } catch (error) {
    console.error("Failed to update settings:", error)
    return NextResponse.json({ error: "Failed to update settings" }, { status: 500 })
  }
}

import useSWR from "swr"
import { api } from "@/lib/api-client"

export interface UserSettings {
  userId: string
  darkMode: boolean
  pushNotifs?: boolean
  emailNotifs?: boolean
  privacyMode?: string
  notifications: {
    email?: boolean
    push?: boolean
    castingInvites?: boolean
    messages?: boolean
    offers?: boolean
  }
  privacy: {
    profileVisibility?: "public" | "verified_only" | "private"
    showMeasurements?: boolean
    showLocation?: boolean
  }
  createdAt?: string
  updatedAt?: string
}

const fetcher = async () => {
  const res = await api.getSettings()
  if (res.error) throw new Error(res.error)
  return res.data as UserSettings
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<UserSettings>("/api/settings", fetcher, {
    revalidateOnFocus: false,
  })

  const updateSettings = async (settings: Partial<UserSettings>) => {
    const res = await api.updateSettings(settings)
    if (res.error) throw new Error(res.error)
    const updated = res.data as UserSettings
    mutate(updated, false)
    return updated
  }

  return {
    settings: data,
    isLoading,
    error,
    updateSettings,
    mutate,
  }
}

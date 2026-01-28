import useSWR from "swr"
import { apiClient } from "@/lib/api-client"

export interface UserSettings {
  userId: string
  darkMode: boolean
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
  return apiClient.get<UserSettings>("/api/settings")
}

export function useSettings() {
  const { data, error, isLoading, mutate } = useSWR<UserSettings>("/api/settings", fetcher, {
    revalidateOnFocus: false,
  })

  const updateSettings = async (settings: Partial<UserSettings>) => {
    const updated = await apiClient.patch<UserSettings>("/api/settings", settings)
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

"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useMyProfile() {
  const { data, error, isLoading, mutate } = useSWR("profile/me", () => api.getMyProfile().then((r) => r.data), {
    revalidateOnFocus: false,
  })

  return {
    profile: data?.profile || null,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useProfile(username: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    username ? `profile/${username}` : null,
    () => (username ? api.getProfile(username).then((r) => r.data) : null),
    { revalidateOnFocus: false },
  )

  return {
    profile: data?.profile || null,
    isLoading,
    error,
    refresh: mutate,
  }
}

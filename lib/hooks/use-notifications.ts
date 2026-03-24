"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useNotifications(unreadOnly?: boolean) {
  const { data, error, isLoading, mutate } = useSWR(
    `notifications${unreadOnly ? "?unread" : ""}`,
    () => api.getNotifications(unreadOnly).then((r) => r.data as any),
    { revalidateOnFocus: true, refreshInterval: 15000 }, // Poll every 15s
  )

  return {
    notifications: data?.notifications || [],
    unreadCount: data?.unreadCount || 0,
    isLoading,
    error,
    refresh: mutate,
  }
}

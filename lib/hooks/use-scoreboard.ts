"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useScoreboard(filter?: string, limit?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `scoreboard/${filter || "top"}/${limit || 20}`,
    () => api.getScoreboard(filter, limit).then((r) => r.data),
    { revalidateOnFocus: false },
  )

  return {
    models: data?.models || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useTopModels(filter?: string, limit?: number) {
  const { data, error, isLoading, mutate } = useSWR(
    `top-models/${filter || "all"}/${limit || 10}`,
    () => api.getTopModels(filter, limit).then((r) => r.data),
    { revalidateOnFocus: false },
  )

  return {
    models: data?.models || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

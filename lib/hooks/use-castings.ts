"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useCastings(params?: { status?: string; query?: string; creatorId?: string }) {
  const key = params ? `castings?${JSON.stringify(params)}` : "castings"

  const { data, error, isLoading, mutate } = useSWR(key, () => api.getCastings(params).then((r) => r.data), {
    revalidateOnFocus: false,
  })

  return {
    castings: data?.castings || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useCasting(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    id ? `casting/${id}` : null,
    () => (id ? api.getCasting(id).then((r) => r.data) : null),
    { revalidateOnFocus: false },
  )

  return {
    casting: data?.casting || null,
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useSubmissions(castingId: string | null, status?: string) {
  const { data, error, isLoading, mutate } = useSWR(
    castingId ? `submissions/${castingId}/${status || "all"}` : null,
    () => (castingId ? api.getSubmissions(castingId, status).then((r) => r.data) : null),
    { revalidateOnFocus: false },
  )

  return {
    submissions: data?.submissions || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

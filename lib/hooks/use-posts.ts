"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function usePosts(params?: { limit?: number; cursor?: string; feed?: string }) {
  const feedParam = params?.feed || ""
  const key = `posts?feed=${feedParam}&cursor=${params?.cursor || ""}`
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.getPosts({ limit: params?.limit ?? 20, cursor: params?.cursor, feed: params?.feed }).then((r) => r.data as any),
    { revalidateOnFocus: true },
  )

  return {
    posts: data?.posts ?? [],
    nextCursor: data?.nextCursor ?? null,
    isLoading,
    error,
    refresh: mutate,
  }
}

"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function usePosts(params?: { limit?: number; cursor?: string }) {
  const key = params?.cursor ? `posts?cursor=${params.cursor}` : "posts"
  const { data, error, isLoading, mutate } = useSWR(
    key,
    () => api.getPosts({ limit: params?.limit ?? 20, cursor: params?.cursor }).then((r) => r.data),
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

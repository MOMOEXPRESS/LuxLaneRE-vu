"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"

export function useConversations() {
  const { data, error, isLoading, mutate } = useSWR("conversations", () => api.getConversations().then((r) => r.data as any), {
    revalidateOnFocus: true,
    refreshInterval: 10000, // Poll every 10s for new conversations
  })

  return {
    conversations: data?.conversations || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

export function useMessages(conversationId: string | null) {
  const { data, error, isLoading, mutate } = useSWR(
    conversationId ? `messages/${conversationId}` : null,
    () => (conversationId ? api.getMessages(conversationId).then((r) => r.data as any) : null),
    { revalidateOnFocus: true, refreshInterval: 5000 }, // Poll every 5s for new messages
  )

  return {
    messages: data?.messages || [],
    isLoading,
    error,
    refresh: mutate,
  }
}

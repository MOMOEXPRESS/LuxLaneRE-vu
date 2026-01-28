"use client"

import useSWR from "swr"
import { api } from "@/lib/api-client"
import { useCallback } from "react"

const fetcher = async () => {
  const result = await api.getCurrentUser()
  if (result.error) throw new Error(result.error)
  return result.data
}

export function useAuth() {
  const { data, error, isLoading, mutate } = useSWR("auth/me", fetcher, {
    revalidateOnFocus: false,
    shouldRetryOnError: false,
  })

  const login = useCallback(
    async (email: string, password: string) => {
      const result = await api.login(email, password)
      if (result.error) throw new Error(result.error)
      await mutate()
      return result.data
    },
    [mutate],
  )

  const signup = useCallback(
    async (email: string, password: string, displayName: string, role: string) => {
      const result = await api.signup(email, password, displayName, role)
      if (result.error) throw new Error(result.error)
      await mutate()
      return result.data
    },
    [mutate],
  )

  const logout = useCallback(async () => {
    await api.logout()
    await mutate(null, { revalidate: false })
  }, [mutate])

  return {
    user: data?.user || null,
    isLoading,
    isAuthenticated: !!data?.user,
    error,
    login,
    signup,
    logout,
    refresh: mutate,
  }
}
